import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    storage_path = Column(String(500), nullable=True)
    is_deleted_from_storage = Column(Boolean, default=False, nullable=False)

    # Extracted fields
    vendor_name = Column(String(255), nullable=True)
    invoice_number = Column(String(100), nullable=True)
    invoice_date = Column(String(50), nullable=True)
    total_amount = Column(Float, default=0.0)
    confidence_score = Column(Float, default=1.0)
    status = Column(String(50), default="completed")  # "verified", "warning", "failed"
    extracted_data_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="documents")


class ParsingJob(Base):
    __tablename__ = "parsing_jobs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    file_name = Column(String(255), nullable=False)
    status = Column(String(50), default="queued", index=True)  # "queued", "processing", "completed", "failed"
    progress = Column(Integer, default=0)  # 0 - 100
    error_message = Column(Text, nullable=True)
    result_data = Column(Text, nullable=True)  # JSON string of extracted invoice

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="jobs")
    logs = relationship("ParsingLog", back_populates="job", cascade="all, delete-orphan")


class ParsingLog(Base):
    __tablename__ = "parsing_logs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    job_id = Column(String, ForeignKey("parsing_jobs.id", ondelete="SET NULL"), nullable=True, index=True)

    # AI Model & Circuit Breaker Tracking
    model_used = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)
    fallback_triggered = Column(Boolean, default=False, nullable=False)

    # Token usage & financial metrics
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    total_cost_usd = Column(Float, default=0.0, nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)

    # Extraction engine flags
    ocr_used = Column(Boolean, default=False, nullable=False)
    math_audit_passed = Column(Boolean, default=True, nullable=False)
    confidence_score = Column(Float, default=1.0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="logs")
    job = relationship("ParsingJob", back_populates="logs")
