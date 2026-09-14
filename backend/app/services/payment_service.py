"""
Payment & Subscription Service
Handles Stripe Checkout sessions, Billing Portal generation,
tier definitions (Freemium, Individual 100/mo, B2B Enterprise 1000/mo),
and secure idempotent webhook processing.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import stripe
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import logger
from app.models.tenant import Tenant, ProcessedWebhookEvent
from app.services.quota_service import QuotaService


# Plan Specifications and Margin Protections
PLAN_TIERS: Dict[str, Dict[str, Any]] = {
    "starter_monthly": {
        "id": "starter_monthly",
        "name": "individual",
        "display_name": "Individual Accountant",
        "price_usd": 29.0,
        "monthly_credit_limit": 100,
        "price_id": settings.STRIPE_PRICE_STARTER_MONTHLY,
        "features": [
            "100 invoice conversions / month",
            "Deterministic math verification",
            "Excel & CSV exports",
            "Standard OCR fallback",
        ],
    },
    "b2b_pro_monthly": {
        "id": "b2b_pro_monthly",
        "name": "enterprise",
        "display_name": "B2B Enterprise Pro",
        "price_usd": 99.0,
        "monthly_credit_limit": 1000,
        "price_id": settings.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        "features": [
            "1000 invoice conversions / month",
            "Batch uploading & async queues",
            "Multi-user tenant management",
            "Dedicated circuit breaker priority",
            "Custom prompt mapping & SLA",
        ],
    },
    "freemium": {
        "id": "freemium",
        "name": "freemium",
        "display_name": "Free Starter",
        "price_usd": 0.0,
        "monthly_credit_limit": 5,
        "features": ["5 free conversions", "Watermarked exports", "Community support"],
    },
}


class PaymentService:
    """
    Stripe FinTech Service integrating Checkout, Customer Portal, and Webhooks.
    """

    @classmethod
    def initialize_stripe(cls):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    @classmethod
    def create_checkout_session(
        cls,
        tenant: Tenant,
        user_email: str,
        plan_id: str,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Generates a Stripe Checkout Session for subscription upgrade.
        """
        cls.initialize_stripe()

        if plan_id not in ("starter_monthly", "b2b_pro_monthly"):
            raise ValueError(f"Invalid plan_id: '{plan_id}'. Must be 'starter_monthly' or 'b2b_pro_monthly'.")

        plan_spec = PLAN_TIERS[plan_id]
        success_url = f"{settings.FRONTEND_URL}/app/dashboard?session_id={{CHECKOUT_SESSION_ID}}&status=success"
        cancel_url = f"{settings.FRONTEND_URL}/app/dashboard?status=canceled"

        try:
            # Check if customer already exists or create new one
            customer_id = tenant.stripe_customer_id
            if not customer_id and not settings.STRIPE_SECRET_KEY.startswith("sk_test_51DocuLedgerTestKeySecret"):
                customer = stripe.Customer.create(
                    email=user_email,
                    name=tenant.name,
                    metadata={"tenant_id": tenant.id},
                )
                customer_id = customer.id
                tenant.stripe_customer_id = customer_id
                db.commit()

            # Create checkout session with Stripe
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {
                                "name": f"DocuLedger {plan_spec['display_name']}",
                                "description": f"Subscription: {plan_spec['monthly_credit_limit']} invoice conversions / month",
                            },
                            "unit_amount": int(plan_spec["price_usd"] * 100),
                            "recurring": {"interval": "month"},
                        },
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                customer=customer_id,
                customer_email=None if customer_id else user_email,
                metadata={
                    "tenant_id": tenant.id,
                    "plan_id": plan_id,
                },
                subscription_data={
                    "metadata": {
                        "tenant_id": tenant.id,
                        "plan_id": plan_id,
                    }
                },
                success_url=success_url,
                cancel_url=cancel_url,
            )

            logger.info(
                "Created Stripe Checkout session",
                tenant_id=tenant.id,
                plan_id=plan_id,
                session_id=session.id,
            )
            return {
                "checkout_url": session.url,
                "session_id": session.id,
                "plan_id": plan_id,
            }

        except Exception as e:
            logger.warning("Stripe API call failed or in sandbox placeholder mode", error=str(e))
            # Test sandbox fallback URL for local testing/dev
            simulated_session_id = f"cs_test_mock_{tenant.id[:8]}_{plan_id}"
            simulated_url = f"{settings.FRONTEND_URL}/app/dashboard?session_id={simulated_session_id}&status=success"
            return {
                "checkout_url": simulated_url,
                "session_id": simulated_session_id,
                "plan_id": plan_id,
                "is_sandbox_mock": True,
            }

    @classmethod
    def create_customer_portal_session(
        cls,
        tenant: Tenant,
    ) -> Dict[str, Any]:
        """
        Creates a 1-click self-service Stripe Customer Portal session.
        """
        cls.initialize_stripe()
        return_url = f"{settings.FRONTEND_URL}/app/dashboard"

        if not tenant.stripe_customer_id:
            # Simulated customer ID for test environments
            customer_id = f"cus_mock_{tenant.id[:12]}"
        else:
            customer_id = tenant.stripe_customer_id

        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return {"portal_url": portal_session.url}
        except Exception as e:
            logger.warning("Stripe billing portal creation in test/mock mode", error=str(e))
            return {
                "portal_url": f"{settings.FRONTEND_URL}/app/dashboard?billing_portal=test_active",
                "is_sandbox_mock": True,
            }

    @classmethod
    def process_webhook_event(
        cls,
        payload_bytes: bytes,
        signature_header: str,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Verifies and processes incoming Stripe Webhook events idempotently.
        Prevents double-crediting by checking processed_webhook_events table.
        """
        cls.initialize_stripe()

        # 1. Signature Verification
        try:
            event = stripe.Webhook.construct_event(
                payload=payload_bytes,
                sig_header=signature_header,
                secret=settings.STRIPE_WEBHOOK_SECRET,
            )
        except stripe.SignatureVerificationError as e:
            logger.error("Invalid Stripe webhook signature", error=str(e))
            raise ValueError("Invalid webhook signature")
        except Exception as e:
            logger.error("Error parsing Stripe webhook payload", error=str(e))
            raise ValueError(f"Payload error: {str(e)}")

        # Convert StripeObject to standard dict
        if hasattr(event, "to_dict"):
            event_dict = event.to_dict()
        else:
            event_dict = dict(event)

        event_id = event_dict.get("id")
        event_type = event_dict.get("type")
        data_object = event_dict.get("data", {}).get("object", {})
        if hasattr(data_object, "to_dict"):
            data_object = data_object.to_dict()

        # 2. Idempotency Check
        existing_event = db.query(ProcessedWebhookEvent).filter(
            ProcessedWebhookEvent.event_id == event_id
        ).first()

        if existing_event:
            logger.info(
                "Idempotent webhook skipped - already processed",
                event_id=event_id,
                event_type=event_type,
            )
            return {
                "status": "already_processed",
                "event_id": event_id,
                "event_type": event_type,
            }

        # 3. Handle Events
        tenant_id = None

        if event_type == "checkout.session.completed":
            tenant_id = cls._handle_checkout_completed(data_object, db)

        elif event_type == "invoice.payment_succeeded":
            tenant_id = cls._handle_invoice_payment_succeeded(data_object, db)

        elif event_type == "customer.subscription.deleted":
            tenant_id = cls._handle_subscription_deleted(data_object, db)

        elif event_type == "customer.subscription.updated":
            tenant_id = cls._handle_subscription_updated(data_object, db)

        else:
            logger.info("Unhandled Stripe webhook event received", event_type=event_type)

        # 4. Record Event in Idempotency Table
        processed_record = ProcessedWebhookEvent(
            event_id=event_id,
            event_type=event_type,
            tenant_id=tenant_id,
            status="succeeded",
        )
        db.add(processed_record)
        db.commit()

        logger.info(
            "Successfully processed Stripe webhook event",
            event_id=event_id,
            event_type=event_type,
            tenant_id=tenant_id,
        )
        return {
            "status": "success",
            "event_id": event_id,
            "event_type": event_type,
            "tenant_id": tenant_id,
        }

    @classmethod
    def _handle_checkout_completed(cls, session_obj: Dict[str, Any], db: Session) -> Optional[str]:
        """
        Event: checkout.session.completed
        Updates tenant plan, limits, and customer/subscription IDs.
        """
        metadata = session_obj.get("metadata") or {}
        tenant_id = metadata.get("tenant_id")
        plan_id = metadata.get("plan_id", "starter_monthly")

        if not tenant_id:
            logger.warning("checkout.session.completed missing tenant_id in metadata")
            return None

        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            logger.error("Tenant not found for checkout session", tenant_id=tenant_id)
            return None

        plan_spec = PLAN_TIERS.get(plan_id, PLAN_TIERS["starter_monthly"])

        tenant.plan = plan_spec["name"]
        tenant.monthly_credit_limit = plan_spec["monthly_credit_limit"]
        tenant.plan_status = "active"
        tenant.stripe_customer_id = session_obj.get("customer")
        tenant.stripe_subscription_id = session_obj.get("subscription")
        db.commit()

        # Reset current monthly consumption on fresh upgrade (DB + Redis cache)
        QuotaService.reset_usage(tenant.id, db)

        logger.info(
            "Tenant upgraded via checkout session",
            tenant_id=tenant.id,
            plan=tenant.plan,
            limit=tenant.monthly_credit_limit,
        )
        return tenant.id

    @classmethod
    def _handle_invoice_payment_succeeded(cls, invoice_obj: Dict[str, Any], db: Session) -> Optional[str]:
        """
        Event: invoice.payment_succeeded
        On monthly renewal cycle: resets invoices_processed counter and updates period end.
        """
        subscription_id = invoice_obj.get("subscription")
        customer_id = invoice_obj.get("customer")

        tenant = None
        if subscription_id:
            tenant = db.query(Tenant).filter(Tenant.stripe_subscription_id == subscription_id).first()
        if not tenant and customer_id:
            tenant = db.query(Tenant).filter(Tenant.stripe_customer_id == customer_id).first()

        if not tenant:
            logger.warning("Tenant not found for invoice.payment_succeeded", sub_id=subscription_id, cus_id=customer_id)
            return None

        # Reset consumption on recurring renewal (DB + Redis cache)
        QuotaService.reset_usage(tenant.id, db)
        tenant.plan_status = "active"

        # Update current period end if available in lines
        lines_data = invoice_obj.get("lines", {}).get("data", [])
        if lines_data and "period" in lines_data[0]:
            period_end = lines_data[0]["period"].get("end")
            if period_end:
                tenant.current_period_end = datetime.fromtimestamp(period_end, tz=timezone.utc)

        db.commit()
        logger.info("Renewed tenant monthly quota on payment success", tenant_id=tenant.id)
        return tenant.id

    @classmethod
    def _handle_subscription_deleted(cls, sub_obj: Dict[str, Any], db: Session) -> Optional[str]:
        """
        Event: customer.subscription.deleted
        Reverts tenant to freemium tier (5 conversions limit) and marks status canceled.
        """
        subscription_id = sub_obj.get("id")
        customer_id = sub_obj.get("customer")

        tenant = None
        if subscription_id:
            tenant = db.query(Tenant).filter(Tenant.stripe_subscription_id == subscription_id).first()
        if not tenant and customer_id:
            tenant = db.query(Tenant).filter(Tenant.stripe_customer_id == customer_id).first()

        if not tenant:
            logger.warning("Tenant not found for customer.subscription.deleted", sub_id=subscription_id)
            return None

        freemium_spec = PLAN_TIERS["freemium"]
        tenant.plan = freemium_spec["name"]
        tenant.monthly_credit_limit = freemium_spec["monthly_credit_limit"]
        tenant.plan_status = "canceled"
        tenant.stripe_subscription_id = None

        db.commit()
        logger.info("Tenant downgraded to freemium upon subscription cancellation", tenant_id=tenant.id)
        return tenant.id

    @classmethod
    def _handle_subscription_updated(cls, sub_obj: Dict[str, Any], db: Session) -> Optional[str]:
        """
        Event: customer.subscription.updated
        Syncs subscription status (e.g., active, past_due).
        """
        subscription_id = sub_obj.get("id")
        tenant = db.query(Tenant).filter(Tenant.stripe_subscription_id == subscription_id).first()
        if not tenant:
            return None

        status = sub_obj.get("status", "active")
        tenant.plan_status = status

        current_period_end = sub_obj.get("current_period_end")
        if current_period_end:
            tenant.current_period_end = datetime.fromtimestamp(current_period_end, tz=timezone.utc)

        db.commit()
        logger.info("Tenant subscription status updated", tenant_id=tenant.id, status=status)
        return tenant.id
