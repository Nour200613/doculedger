"""
Extraction Engine - Main Invoice Parser Orchestrator
Coordinates:
1. OCR Fallback Pipeline (pdfplumber vs scanned image OCR)
2. Dynamic Prompt Mapping with Natural Language Custom Instructions
3. Model-Agnostic Hot-Swapping Circuit Breaker
4. Deterministic Pandas Math Verification Engine
5. Token & USD Cost Logging to Database
"""

from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.extraction_engine.ocr_fallback import OCRFallbackPipeline, ExtractedDocumentText
from app.extraction_engine.prompts import PromptMapper
from app.extraction_engine.circuit_breaker import CircuitBreaker, LLMExecutionResult
from app.extraction_engine.math_auditor import MathAuditor, MathAuditResult
from app.models.document import ParsingLog
from app.core.logging import logger


class InvoiceParser:
    """
    Main orchestration engine for financial document extraction and deterministic auditing.
    """

    def __init__(self, circuit_breaker: Optional[CircuitBreaker] = None):
        self.circuit_breaker = circuit_breaker or CircuitBreaker()

    def parse_and_audit(
        self,
        pdf_source: Any,
        user_instructions: Optional[str] = None,
        custom_fields: Optional[List[str]] = None,
        db: Optional[Session] = None,
        tenant_id: Optional[str] = None,
        job_id: Optional[str] = None,
        document_id: Optional[str] = None,
        force_ocr: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes end-to-end extraction and deterministic mathematical audit.
        """
        logger.info("Starting document extraction pipeline", tenant_id=tenant_id, job_id=job_id)

        # 1. OCR Fallback & Digital Extraction Stage
        doc_text_result: ExtractedDocumentText = OCRFallbackPipeline.extract_from_pdf(
            pdf_source=pdf_source, force_ocr=force_ocr
        )

        # 2. Dynamic Prompt Mapping
        prompts = PromptMapper.build_prompts(
            document_text=doc_text_result.text,
            user_instructions=user_instructions,
            custom_fields=custom_fields,
        )

        # 3. LLM Circuit Breaker Execution (Primary -> Fallback)
        llm_result: LLMExecutionResult = self.circuit_breaker.execute(
            system_prompt=prompts["system_prompt"],
            user_prompt=prompts["user_prompt"],
        )

        # 4. Deterministic Python & Pandas Math Audit
        extracted_data = llm_result.parsed_json
        math_audit: MathAuditResult = MathAuditor.audit_invoice(
            extracted_data=extracted_data,
            initial_confidence=0.96,
        )

        # 5. Merge Audit Results into output
        final_confidence = math_audit.confidence_score
        audit_dict = math_audit.to_dict()

        output: Dict[str, Any] = {
            # Extracted header fields
            "vendor_name": extracted_data.get("vendor_name", "Unknown Vendor"),
            "vendor_address": extracted_data.get("vendor_address"),
            "vendor_tax_id": extracted_data.get("vendor_tax_id"),
            "customer_name": extracted_data.get("customer_name"),
            "invoice_number": extracted_data.get("invoice_number", "INV-UNKNOWN"),
            "invoice_date": extracted_data.get("invoice_date"),
            "due_date": extracted_data.get("due_date"),
            "currency": extracted_data.get("currency", "USD"),
            # Stated vs Calculated Totals
            "stated_subtotal": audit_dict["stated_subtotal"],
            "calculated_subtotal": audit_dict["calculated_subtotal"],
            "stated_tax_amount": audit_dict["stated_tax_amount"],
            "calculated_tax_amount": audit_dict["calculated_tax_amount"],
            "stated_total": audit_dict["stated_total"],
            "calculated_total": audit_dict["calculated_total"],
            "total_amount": audit_dict["stated_total"],  # Standard field for dashboard
            "subtotal": audit_dict["calculated_subtotal"],
            "vat_total": audit_dict["calculated_tax_amount"],
            # Line items with audit tags
            "line_items": extracted_data.get("line_items", []),
            "custom_fields": extracted_data.get("custom_fields", {}),
            # Math Audit Engine Metrics
            "math_audit_passed": audit_dict["math_audit_passed"],
            "audit_status": audit_dict["audit_status"],
            "discrepancy_amount": audit_dict["discrepancy_amount"],
            "discrepancy_notes": audit_dict["discrepancy_notes"],
            "line_item_audits": audit_dict["line_item_audits"],
            "confidence_score": final_confidence,
            # Document Text & Bounding Boxes for Split-Screen UI
            "ocr_used": doc_text_result.is_ocr_fallback,
            "ocr_engine": doc_text_result.ocr_engine,
            "bounding_boxes": [b.to_dict() for b in doc_text_result.bounding_boxes],
            # AI Inference & Cost Metrics
            "metrics": {
                "model_used": llm_result.model_used,
                "provider": llm_result.provider,
                "fallback_triggered": llm_result.fallback_triggered,
                "input_tokens": llm_result.input_tokens,
                "output_tokens": llm_result.output_tokens,
                "total_cost_usd": llm_result.cost_usd,
                "latency_ms": llm_result.latency_ms,
            },
        }

        # 6. Database Token Usage & Cost Logging
        if db and tenant_id:
            try:
                log_entry = ParsingLog(
                    tenant_id=tenant_id,
                    document_id=document_id,
                    job_id=job_id,
                    model_used=llm_result.model_used,
                    provider=llm_result.provider,
                    fallback_triggered=llm_result.fallback_triggered,
                    input_tokens=llm_result.input_tokens,
                    output_tokens=llm_result.output_tokens,
                    total_cost_usd=llm_result.cost_usd,
                    latency_ms=llm_result.latency_ms,
                    ocr_used=doc_text_result.is_ocr_fallback,
                    math_audit_passed=audit_dict["math_audit_passed"],
                    confidence_score=final_confidence,
                )
                db.add(log_entry)
                db.commit()
                logger.info(
                    "Logged parsing metrics to database",
                    cost_usd=llm_result.cost_usd,
                    tokens_in=llm_result.input_tokens,
                    tokens_out=llm_result.output_tokens,
                    model=llm_result.model_used,
                )
            except Exception as e:
                logger.error("Failed to write parsing log to database", error=str(e))
                db.rollback()

        return output


# Global default parser instance
_default_parser = InvoiceParser()


def extract_and_audit_invoice(
    pdf_source: Any,
    user_instructions: Optional[str] = None,
    custom_fields: Optional[List[str]] = None,
    db: Optional[Session] = None,
    tenant_id: Optional[str] = None,
    job_id: Optional[str] = None,
    document_id: Optional[str] = None,
    force_ocr: bool = False,
) -> Dict[str, Any]:
    """
    Convenience functional interface for parsing and auditing an invoice document.
    """
    return _default_parser.parse_and_audit(
        pdf_source=pdf_source,
        user_instructions=user_instructions,
        custom_fields=custom_fields,
        db=db,
        tenant_id=tenant_id,
        job_id=job_id,
        document_id=document_id,
        force_ocr=force_ocr,
    )
