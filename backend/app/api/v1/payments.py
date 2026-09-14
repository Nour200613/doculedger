"""
Payments & Billing Endpoints (v1)
FastAPI routes for Stripe Checkout Session generation,
Customer Portal redirection, and secure Webhook processing.
"""

from app.api.endpoints.payments import router

__all__ = ["router"]
