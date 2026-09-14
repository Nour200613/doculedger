"""
Integration Tests - End-to-End Extraction Engine & Parsing Log
Verifies the complete flow: PDF extraction, LLM parsing, math auditing,
database logging of token usage and USD costs, and task execution.
"""

import io
import json
import pytest
import pypdf
from app.extraction_engine.parser import extract_and_audit_invoice
from app.tasks.parse_tasks import execute_parsing_logic
from app.models.tenant import Tenant
from app.models.document import ParsingJob, Document, ParsingLog


def test_end_to_end_extraction_and_audit_with_db_log(db, sample_tenant):
    """
    Test that extract_and_audit_invoice generates complete structured output,
    executes deterministic math auditing, and records a ParsingLog entry in SQLite.
    """
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    result = extract_and_audit_invoice(
        pdf_source=pdf_bytes,
        user_instructions="Extract payment terms and swift code",
        db=db,
        tenant_id=sample_tenant.id,
        job_id="test-job-999",
    )

    # 1. Check extracted fields
    assert "vendor_name" in result
    assert "invoice_number" in result
    assert "stated_total" in result
    assert "calculated_total" in result
    assert "math_audit_passed" in result
    assert "confidence_score" in result
    assert "metrics" in result

    # 2. Check metrics
    metrics = result["metrics"]
    assert metrics["input_tokens"] > 0
    assert metrics["output_tokens"] > 0
    assert metrics["total_cost_usd"] > 0.0
    assert metrics["latency_ms"] >= 0

    # 3. Check that ParsingLog was written to the database
    log_entry = db.query(ParsingLog).filter(ParsingLog.tenant_id == sample_tenant.id).first()
    assert log_entry is not None
    assert log_entry.tenant_id == sample_tenant.id
    assert log_entry.input_tokens == metrics["input_tokens"]
    assert log_entry.output_tokens == metrics["output_tokens"]
    assert log_entry.total_cost_usd == metrics["total_cost_usd"]
    assert log_entry.math_audit_passed == result["math_audit_passed"]


def test_parse_task_execution_with_extraction_engine(db, sample_tenant):
    """
    Test execute_parsing_logic runs end-to-end, creates Document, updates ParsingJob to completed,
    and logs parsing metrics.
    """
    job = ParsingJob(
        tenant_id=sample_tenant.id,
        file_name="invoice_2026_q3.pdf",
        status="queued",
        progress=0,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Execute task
    result = execute_parsing_logic(
        job_id=job.id,
        tenant_id=sample_tenant.id,
        file_name="invoice_2026_q3.pdf",
    )

    assert result is not None
    assert "stated_total" in result
    assert "calculated_total" in result

    # Verify job state in DB
    db.expire_all()
    updated_job = db.query(ParsingJob).filter(ParsingJob.id == job.id).first()
    assert updated_job.status == "completed"
    assert updated_job.progress == 100
    assert updated_job.document_id is not None

    # Verify document in DB
    doc = db.query(Document).filter(Document.id == updated_job.document_id).first()
    assert doc is not None
    assert doc.tenant_id == sample_tenant.id
    assert doc.vendor_name is not None
    assert doc.confidence_score > 0.0
