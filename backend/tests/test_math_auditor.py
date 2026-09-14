"""
Unit Tests - Deterministic Math Auditor
Verifies mathematical verification, line-item multiplication, subtotal summation,
tax reconciliation, and confidence score penalty (< 0.85) on discrepancies.
"""

import pytest
from app.extraction_engine.math_auditor import MathAuditor, MathAuditResult


def test_math_audit_passes_on_perfect_invoice():
    """
    Test that an invoice with 100% mathematically correct line items and totals
    passes audit with status 'verified' and confidence >= 0.85.
    """
    invoice_data = {
        "vendor_name": "Apex Cloud Infrastructure Ltd.",
        "invoice_number": "INV-2026-001",
        "currency": "USD",
        "stated_subtotal": 4000.0,
        "stated_tax_rate": 0.14,
        "stated_tax_amount": 560.0,
        "stated_discount": 0.0,
        "stated_total": 4560.0,
        "line_items": [
            {
                "description": "Server Instance Large",
                "quantity": 2.0,
                "unit_price": 1500.0,
                "stated_line_total": 3000.0,
                "tax_rate": 0.14,
            },
            {
                "description": "Storage Volume 10TB",
                "quantity": 1.0,
                "unit_price": 1000.0,
                "stated_line_total": 1000.0,
                "tax_rate": 0.14,
            },
        ],
    }

    result: MathAuditResult = MathAuditor.audit_invoice(invoice_data, initial_confidence=0.96)

    assert result.math_audit_passed is True
    assert result.audit_status == "verified"
    assert result.discrepancy_amount == 0.0
    assert result.confidence_score >= 0.85
    assert result.calculated_total == 4560.0
    assert result.calculated_subtotal == 4000.0
    assert result.calculated_tax_amount == 560.0
    assert len(result.discrepancy_notes) == 0


def test_math_audit_flags_hallucinated_total():
    """
    Test that when an LLM or invoice states a hallucinated total (e.g. 5000 instead of 4560),
    the deterministic auditor catches the discrepancy and downgrades confidence to < 0.85.
    """
    invoice_data = {
        "vendor_name": "Apex Cloud Infrastructure Ltd.",
        "invoice_number": "INV-2026-002",
        "currency": "USD",
        "stated_subtotal": 4000.0,
        "stated_tax_rate": 0.14,
        "stated_tax_amount": 560.0,
        "stated_total": 5200.0,  # Hallucinated / mismatched total (+640.0 diff)
        "line_items": [
            {
                "description": "Server Instance Large",
                "quantity": 2.0,
                "unit_price": 1500.0,
                "stated_line_total": 3000.0,
            },
            {
                "description": "Storage Volume 10TB",
                "quantity": 1.0,
                "unit_price": 1000.0,
                "stated_line_total": 1000.0,
            },
        ],
    }

    result: MathAuditResult = MathAuditor.audit_invoice(invoice_data, initial_confidence=0.98)

    assert result.math_audit_passed is False
    assert result.audit_status == "warning"
    assert result.discrepancy_amount == 640.0
    # Strict requirement: confidence_score < 0.85 (capped at 0.70)
    assert result.confidence_score < 0.85
    assert result.confidence_score == 0.70
    assert any("Total reconciliation failure" in note for note in result.discrepancy_notes)


def test_math_audit_detects_line_item_multiplication_error():
    """
    Test that when a line item quantity * unit_price != stated_line_total,
    the auditor records the per-line item discrepancy.
    """
    invoice_data = {
        "vendor_name": "Hardware Supplies Inc.",
        "invoice_number": "INV-2026-003",
        "stated_total": 1500.0,
        "line_items": [
            {
                "description": "Office Chair",
                "quantity": 3.0,
                "unit_price": 200.0,
                "stated_line_total": 900.0,  # 3 * 200 is 600, but stated is 900!
            },
            {
                "description": "Standing Desk",
                "quantity": 1.0,
                "unit_price": 600.0,
                "stated_line_total": 600.0,
            },
        ],
    }

    result = MathAuditor.audit_invoice(invoice_data)

    assert result.line_item_audits[0].has_discrepancy is True
    assert result.line_item_audits[0].discrepancy_amount == -300.0
    assert result.line_item_audits[1].has_discrepancy is False
    assert any("Line 1" in note for note in result.discrepancy_notes)


def test_math_audit_handles_discounts_and_item_taxes():
    """
    Test calculations with individual line item taxes and an overall discount.
    """
    invoice_data = {
        "stated_total": 1090.0,
        "stated_discount": 50.0,
        "line_items": [
            {
                "description": "Item A",
                "quantity": 10.0,
                "unit_price": 100.0,  # 1000.0
                "tax_rate": 0.14,      # 140.0 tax
            },
        ],
    }
    # calculated: 1000 subtotal + 140 tax - 50 discount = 1090.0
    result = MathAuditor.audit_invoice(invoice_data)

    assert result.math_audit_passed is True
    assert result.calculated_subtotal == 1000.0
    assert result.calculated_tax_amount == 140.0
    assert result.calculated_total == 1090.0
    assert result.audit_status == "verified"
