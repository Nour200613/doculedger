"""
Extraction Engine Package
Contains prompt mapping, deterministic math auditing, OCR fallback pipeline,
and model-agnostic circuit breaker with token/cost logging.
"""

from app.extraction_engine.prompts import PromptMapper, BASE_EXTRACTION_SYSTEM_PROMPT
from app.extraction_engine.math_auditor import MathAuditor, MathAuditResult
from app.extraction_engine.ocr_fallback import OCRFallbackPipeline, ExtractedDocumentText
from app.extraction_engine.circuit_breaker import CircuitBreaker, LLMProviderConfig
from app.extraction_engine.parser import InvoiceParser, extract_and_audit_invoice

__all__ = [
    "PromptMapper",
    "BASE_EXTRACTION_SYSTEM_PROMPT",
    "MathAuditor",
    "MathAuditResult",
    "OCRFallbackPipeline",
    "ExtractedDocumentText",
    "CircuitBreaker",
    "LLMProviderConfig",
    "InvoiceParser",
    "extract_and_audit_invoice",
]
