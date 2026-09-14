"""
Payments & Billing Endpoints
FastAPI routes for Stripe Checkout Session generation,
Customer Portal redirection, and secure Webhook processing.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.services.payment_service import PaymentService, PLAN_TIERS
from app.core.logging import logger

router = APIRouter()


class CheckoutSessionRequest(BaseModel):
    plan_id: str = Field(..., description="'starter_monthly' ($29/mo) or 'b2b_pro_monthly' ($99/mo)")


@router.post("/create-checkout-session", status_code=status.HTTP_200_OK)
def create_checkout_session(
    body: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a Stripe Checkout Session for upgrading tenant subscription.
    Returns the redirect checkout_url.
    """
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant organization not found")

    try:
        session_data = PaymentService.create_checkout_session(
            tenant=tenant,
            user_email=current_user.email,
            plan_id=body.plan_id,
            db=db,
        )
        return session_data
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("Failed to create Stripe Checkout session", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to initialize checkout session")


@router.post("/customer-portal", status_code=status.HTTP_200_OK)
def create_customer_portal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates a 1-click self-service Stripe Billing Portal URL
    for updating credit cards, reviewing invoices, or canceling plans.
    """
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant organization not found")

    try:
        portal_data = PaymentService.create_customer_portal_session(tenant=tenant)
        return portal_data
    except Exception as e:
        logger.error("Failed to generate billing portal session", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to access billing portal")


@router.get("/subscription-status", status_code=status.HTTP_200_OK)
def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns current tenant's subscription status, credit quota, and available plan tiers.
    """
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant organization not found")

    credits_remaining = max(0, tenant.monthly_credit_limit - tenant.invoices_processed)

    return {
        "tenant_id": tenant.id,
        "plan": tenant.plan,
        "plan_status": tenant.plan_status,
        "monthly_credit_limit": tenant.monthly_credit_limit,
        "invoices_processed": tenant.invoices_processed,
        "credits_remaining": credits_remaining,
        "stripe_customer_id": tenant.stripe_customer_id,
        "stripe_subscription_id": tenant.stripe_subscription_id,
        "current_period_end": tenant.current_period_end.isoformat() if tenant.current_period_end else None,
        "tiers": list(PLAN_TIERS.values()),
    }


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook_listener(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Secure Stripe Webhook Listener.
    Verifies HMAC-SHA256 signature using STRIPE_WEBHOOK_SECRET,
    enforces idempotency via processed_webhook_events table,
    and updates tenant credit limits and subscription states.
    """
    payload_bytes = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    if not sig_header:
        logger.warning("Stripe webhook received without Stripe-Signature header")
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        result = PaymentService.process_webhook_event(
            payload_bytes=payload_bytes,
            signature_header=sig_header,
            db=db,
        )
        return {"received": True, **result}
    except ValueError as ve:
        logger.error("Stripe webhook verification error", error=str(ve))
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("Unhandled error processing webhook", error=str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed")
