import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False)
    plan = Column(String(50), default="individual", nullable=False)
    monthly_credit_limit = Column(Integer, default=100, nullable=False)
    invoices_processed = Column(Integer, default=0, nullable=False)
    auto_delete_original_pdf = Column(Boolean, default=True, nullable=False)
    api_key = Column(String(100), unique=True, index=True, default=lambda: f"dcl_live_{uuid.uuid4().hex[:20]}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Stripe Billing & Subscription fields
    stripe_customer_id = Column(String(100), nullable=True, index=True)
    stripe_subscription_id = Column(String(100), nullable=True, index=True)
    plan_status = Column(String(50), default="active", nullable=False)  # "active", "past_due", "canceled"
    current_period_end = Column(DateTime, nullable=True)

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="tenant", cascade="all, delete-orphan")
    jobs = relationship("ParsingJob", back_populates="tenant", cascade="all, delete-orphan")
    logs = relationship("ParsingLog", back_populates="tenant", cascade="all, delete-orphan")


class ProcessedWebhookEvent(Base):
    __tablename__ = "processed_webhook_events"

    event_id = Column(String(100), primary_key=True, index=True)
    event_type = Column(String(100), nullable=False)
    tenant_id = Column(String(100), nullable=True, index=True)
    processed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="succeeded")
