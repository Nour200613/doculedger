"""
Unit & Integration Tests - Milestone 4: Payment Infrastructure & Webhooks
Verifies:
1. Subscription status retrieval and tier specifications
2. Stripe Checkout session creation and customer portal link generation
3. Webhook signature validation and rejection of forged payloads
4. Event checkout.session.completed: plan upgrade, credit quota update, usage reset
5. Idempotent webhook processing: prevents double-crediting on event replay
6. Event invoice.payment_succeeded: monthly renewal quota reset
7. Event customer.subscription.deleted: automatic downgrade to freemium tier (5 credits)
"""

import time
import json
import hmac
import hashlib
import pytest
import stripe
from app.core.config import settings
from app.models.tenant import Tenant, ProcessedWebhookEvent
from app.services.payment_service import PaymentService, PLAN_TIERS


def generate_signed_stripe_header(payload_str: str, secret: str) -> str:
    """Generates a valid cryptographic Stripe-Signature header for testing."""
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{payload_str}"
    mac = hmac.new(
        secret.encode("utf-8"),
        signed_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"t={timestamp},v1={mac}"


def test_get_subscription_status(client, auth_headers, sample_tenant):
    """
    Test retrieving active tenant subscription details, remaining credits, and tiers.
    """
    response = client.get("/api/v1/payments/subscription-status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["tenant_id"] == sample_tenant.id
    assert data["plan"] == sample_tenant.plan
    assert data["monthly_credit_limit"] == sample_tenant.monthly_credit_limit
    assert data["invoices_processed"] == sample_tenant.invoices_processed
    assert data["credits_remaining"] == sample_tenant.monthly_credit_limit - sample_tenant.invoices_processed
    assert len(data["tiers"]) == 3  # Freemium, Individual, Enterprise


def test_create_checkout_session_success(client, auth_headers, sample_tenant):
    """
    Test creating a Stripe Checkout session for 'starter_monthly' plan.
    """
    response = client.post(
        "/api/v1/payments/create-checkout-session",
        headers=auth_headers,
        json={"plan_id": "starter_monthly"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "checkout_url" in data
    assert "session_id" in data
    assert data["plan_id"] == "starter_monthly"


def test_create_checkout_session_invalid_plan(client, auth_headers):
    """
    Test that invalid plan IDs are rejected with HTTP 400.
    """
    response = client.post(
        "/api/v1/payments/create-checkout-session",
        headers=auth_headers,
        json={"plan_id": "unsupported_crypto_plan"},
    )
    assert response.status_code == 400
    assert "Invalid plan_id" in response.json()["detail"]


def test_create_customer_portal(client, auth_headers, sample_tenant):
    """
    Test generation of the self-service Stripe Customer Portal URL.
    """
    response = client.post("/api/v1/payments/customer-portal", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "portal_url" in data
    assert "http" in data["portal_url"]


def test_webhook_rejects_missing_signature(client):
    """
    Test that webhook requests without Stripe-Signature header are rejected with HTTP 400.
    """
    response = client.post("/api/v1/payments/webhook", content=b"{}")
    assert response.status_code == 400
    assert "Missing Stripe-Signature" in response.json()["detail"]


def test_webhook_rejects_invalid_signature(client):
    """
    Test that webhook requests with forged or invalid signatures are rejected with HTTP 400.
    """
    response = client.post(
        "/api/v1/payments/webhook",
        content=b'{"id": "evt_test_fake"}',
        headers={"Stripe-Signature": "t=12345,v1=fake_signature_hash_value"},
    )
    assert response.status_code == 400
    assert "Invalid webhook signature" in response.json()["detail"]


def test_webhook_checkout_session_completed(client, db, sample_tenant):
    """
    Test event checkout.session.completed:
    Tenant plan is upgraded, monthly limit updated, subscription ID stored, and usage counter reset.
    """
    # Set initial tenant state
    sample_tenant.invoices_processed = 45
    sample_tenant.plan = "freemium"
    sample_tenant.monthly_credit_limit = 5
    db.commit()

    event_id = "evt_test_checkout_comp_001"
    sub_id = "sub_live_stripe_99218"
    cus_id = "cus_live_stripe_88192"

    payload_dict = {
        "id": event_id,
        "object": "event",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_session_123",
                "customer": cus_id,
                "subscription": sub_id,
                "metadata": {
                    "tenant_id": sample_tenant.id,
                    "plan_id": "starter_monthly",
                },
            }
        },
    }
    payload_str = json.dumps(payload_dict)
    sig_header = generate_signed_stripe_header(payload_str, settings.STRIPE_WEBHOOK_SECRET)

    response = client.post(
        "/api/v1/payments/webhook",
        content=payload_str.encode("utf-8"),
        headers={"Stripe-Signature": sig_header},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Verify tenant in database
    db.expire_all()
    updated_tenant = db.query(Tenant).filter(Tenant.id == sample_tenant.id).first()
    assert updated_tenant.plan == "individual"
    assert updated_tenant.monthly_credit_limit == 100
    assert updated_tenant.plan_status == "active"
    assert updated_tenant.stripe_subscription_id == sub_id
    assert updated_tenant.stripe_customer_id == cus_id
    assert updated_tenant.invoices_processed == 0  # Reset upon fresh upgrade


def test_webhook_idempotency_prevents_double_crediting(client, db, sample_tenant):
    """
    Test Idempotency Guarantee:
    Submitting the exact same webhook event twice must NOT re-apply state changes or double credit.
    """
    event_id = "evt_test_idempotent_999"
    payload_dict = {
        "id": event_id,
        "object": "event",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_session_idemp",
                "customer": "cus_idemp_1",
                "subscription": "sub_idemp_1",
                "metadata": {
                    "tenant_id": sample_tenant.id,
                    "plan_id": "b2b_pro_monthly",
                },
            }
        },
    }
    payload_str = json.dumps(payload_dict)
    sig_header = generate_signed_stripe_header(payload_str, settings.STRIPE_WEBHOOK_SECRET)

    # First delivery: Should succeed and upgrade to Enterprise (1000 limit)
    resp1 = client.post(
        "/api/v1/payments/webhook",
        content=payload_str.encode("utf-8"),
        headers={"Stripe-Signature": sig_header},
    )
    assert resp1.status_code == 200
    assert resp1.json()["status"] == "success"

    db.expire_all()
    tenant = db.query(Tenant).filter(Tenant.id == sample_tenant.id).first()
    assert tenant.plan == "enterprise"
    assert tenant.monthly_credit_limit == 1000

    # Simulate tenant processing 42 invoices after upgrade
    tenant.invoices_processed = 42
    db.commit()

    # Second delivery (Stripe retry with exact same event ID):
    resp2 = client.post(
        "/api/v1/payments/webhook",
        content=payload_str.encode("utf-8"),
        headers={"Stripe-Signature": sig_header},
    )
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "already_processed"

    # Assert tenant usage was NOT reset back to 0 on duplicate event!
    db.expire_all()
    tenant_after = db.query(Tenant).filter(Tenant.id == sample_tenant.id).first()
    assert tenant_after.invoices_processed == 42


def test_webhook_invoice_payment_succeeded_monthly_renewal(client, db, sample_tenant):
    """
    Test event invoice.payment_succeeded:
    Monthly renewal resets invoices_processed counter and updates period end.
    """
    sub_id = "sub_renewal_test_555"
    sample_tenant.stripe_subscription_id = sub_id
    sample_tenant.invoices_processed = 98  # Near quota limit
    db.commit()

    renewal_timestamp = int(time.time()) + (30 * 24 * 3600)
    event_id = "evt_test_renewal_001"
    payload_dict = {
        "id": event_id,
        "object": "event",
        "type": "invoice.payment_succeeded",
        "data": {
            "object": {
                "id": "in_test_invoice_renewal",
                "subscription": sub_id,
                "customer": sample_tenant.stripe_customer_id,
                "billing_reason": "subscription_cycle",
                "lines": {
                    "data": [
                        {
                            "period": {
                                "start": int(time.time()),
                                "end": renewal_timestamp,
                            }
                        }
                    ]
                },
            }
        },
    }
    payload_str = json.dumps(payload_dict)
    sig_header = generate_signed_stripe_header(payload_str, settings.STRIPE_WEBHOOK_SECRET)

    response = client.post(
        "/api/v1/payments/webhook",
        content=payload_str.encode("utf-8"),
        headers={"Stripe-Signature": sig_header},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    db.expire_all()
    updated_tenant = db.query(Tenant).filter(Tenant.id == sample_tenant.id).first()
    assert updated_tenant.invoices_processed == 0
    assert updated_tenant.plan_status == "active"
    assert updated_tenant.current_period_end is not None


def test_webhook_customer_subscription_deleted_downgrades_to_freemium(client, db, sample_tenant):
    """
    Test event customer.subscription.deleted:
    When a user cancels their subscription, tenant is immediately downgraded
    to freemium tier (5 credits limit) and plan_status is marked 'canceled'.
    """
    sub_id = "sub_cancel_test_777"
    sample_tenant.stripe_subscription_id = sub_id
    sample_tenant.plan = "enterprise"
    sample_tenant.monthly_credit_limit = 1000
    sample_tenant.plan_status = "active"
    db.commit()

    event_id = "evt_test_cancel_001"
    payload_dict = {
        "id": event_id,
        "object": "event",
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": sub_id,
                "customer": sample_tenant.stripe_customer_id,
            }
        },
    }
    payload_str = json.dumps(payload_dict)
    sig_header = generate_signed_stripe_header(payload_str, settings.STRIPE_WEBHOOK_SECRET)

    response = client.post(
        "/api/v1/payments/webhook",
        content=payload_str.encode("utf-8"),
        headers={"Stripe-Signature": sig_header},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    db.expire_all()
    downgraded_tenant = db.query(Tenant).filter(Tenant.id == sample_tenant.id).first()
    assert downgraded_tenant.plan == "freemium"
    assert downgraded_tenant.monthly_credit_limit == 5
    assert downgraded_tenant.plan_status == "canceled"
    assert downgraded_tenant.stripe_subscription_id is None
