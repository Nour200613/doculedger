"""
Extraction Engine - Deterministic Python & Pandas Math Auditor
Executes independent mathematical verification on extracted invoice data to eliminate hallucinated totals.
Recalculates: line_item_total = quantity * unit_price, subtotal = sum(line_totals), total = subtotal + tax - discount.
Assigns confidence warning flag (< 0.85) when discrepancy > 0.01.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import pandas as pd
import numpy as np


@dataclass
class LineItemAudit:
    index: int
    description: str
    quantity: float
    unit_price: float
    stated_line_total: float
    computed_line_total: float
    has_discrepancy: bool
    discrepancy_amount: float


@dataclass
class MathAuditResult:
    math_audit_passed: bool
    stated_total: float
    calculated_total: float
    stated_subtotal: Optional[float]
    calculated_subtotal: float
    stated_tax_amount: Optional[float]
    calculated_tax_amount: float
    stated_discount: float
    discrepancy_amount: float
    confidence_score: float
    audit_status: str  # "verified" or "warning"
    discrepancy_notes: List[str] = field(default_factory=list)
    line_item_audits: List[LineItemAudit] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "math_audit_passed": self.math_audit_passed,
            "stated_total": round(self.stated_total, 2),
            "calculated_total": round(self.calculated_total, 2),
            "stated_subtotal": round(self.stated_subtotal, 2) if self.stated_subtotal is not None else None,
            "calculated_subtotal": round(self.calculated_subtotal, 2),
            "stated_tax_amount": round(self.stated_tax_amount, 2) if self.stated_tax_amount is not None else None,
            "calculated_tax_amount": round(self.calculated_tax_amount, 2),
            "stated_discount": round(self.stated_discount, 2),
            "discrepancy_amount": round(self.discrepancy_amount, 2),
            "confidence_score": round(self.confidence_score, 2),
            "audit_status": self.audit_status,
            "discrepancy_notes": self.discrepancy_notes,
            "line_item_audits": [
                {
                    "index": item.index,
                    "description": item.description,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "stated_line_total": round(item.stated_line_total, 2),
                    "computed_line_total": round(item.computed_line_total, 2),
                    "has_discrepancy": item.has_discrepancy,
                    "discrepancy_amount": round(item.discrepancy_amount, 2),
                }
                for item in self.line_item_audits
            ],
        }


class MathAuditor:
    """
    Deterministic Financial Auditor using Pandas.
    Audits raw LLM extracted data independently of LLM reasoning.
    """

    TOLERANCE: float = 0.01

    @classmethod
    def audit_invoice(
        cls,
        extracted_data: Dict[str, Any],
        initial_confidence: float = 0.95
    ) -> MathAuditResult:
        """
        Takes raw LLM extracted JSON and verifies all mathematical calculations:
        1. Validates each line item: quantity * unit_price == stated_line_total
        2. Recalculates subtotal = sum(computed_line_totals)
        3. Recalculates tax = sum(line_item_taxes) or subtotal * tax_rate
        4. Recalculates total = subtotal + tax - discount
        5. Compares calculated total against stated total.
        6. Downgrades confidence to 0.70 (<0.85) if discrepancy > 0.01.
        """
        stated_total = float(extracted_data.get("stated_total") or extracted_data.get("total_amount") or 0.0)
        stated_subtotal = extracted_data.get("stated_subtotal") or extracted_data.get("subtotal")
        if stated_subtotal is not None:
            stated_subtotal = float(stated_subtotal)

        stated_tax_rate = extracted_data.get("stated_tax_rate") or extracted_data.get("vat_rate")
        if stated_tax_rate is not None:
            stated_tax_rate = float(stated_tax_rate)

        stated_tax_amount = extracted_data.get("stated_tax_amount") or extracted_data.get("vat_total")
        if stated_tax_amount is not None:
            stated_tax_amount = float(stated_tax_amount)

        stated_discount = float(extracted_data.get("stated_discount") or 0.0)
        raw_items = extracted_data.get("line_items") or []

        discrepancy_notes: List[str] = []
        line_item_audits: List[LineItemAudit] = []

        if not raw_items:
            # Document has no line items extracted
            calculated_subtotal = stated_subtotal if stated_subtotal is not None else stated_total
            calculated_tax = stated_tax_amount if stated_tax_amount is not None else 0.0
            calculated_total = round(calculated_subtotal + calculated_tax - stated_discount, 2)
        else:
            # Build pandas DataFrame for deterministic vector calculations
            df = pd.DataFrame(raw_items)

            # Ensure expected numeric columns
            for col in ["quantity", "unit_price"]:
                if col not in df.columns:
                    df[col] = 1.0
                else:
                    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

            if "stated_line_total" not in df.columns:
                if "total" in df.columns:
                    df["stated_line_total"] = pd.to_numeric(df["total"], errors="coerce").fillna(0.0)
                else:
                    df["stated_line_total"] = df["quantity"] * df["unit_price"]
            else:
                df["stated_line_total"] = pd.to_numeric(df["stated_line_total"], errors="coerce").fillna(0.0)

            if "description" not in df.columns:
                if "item_description" in df.columns:
                    df["description"] = df["item_description"].fillna("")
                else:
                    df["description"] = ""

            if "tax_rate" not in df.columns:
                df["tax_rate"] = 0.0
            else:
                df["tax_rate"] = pd.to_numeric(df["tax_rate"], errors="coerce").fillna(0.0)

            # 1. Pandas computation of line item totals
            df["computed_line_total"] = (df["quantity"] * df["unit_price"]).round(2)
            df["line_discrepancy"] = (df["computed_line_total"] - df["stated_line_total"]).round(2)
            df["has_discrepancy"] = df["line_discrepancy"].abs() > cls.TOLERANCE

            # Check individual line item discrepancies
            for idx, row in df.iterrows():
                has_disc = bool(row["has_discrepancy"])
                disc_amt = float(row["line_discrepancy"])
                desc = str(row["description"]) or f"Item #{idx + 1}"

                if has_disc:
                    discrepancy_notes.append(
                        f"Line {idx + 1} ('{desc}'): Stated {row['stated_line_total']} vs "
                        f"Computed {row['computed_line_total']} (qty: {row['quantity']} * price: {row['unit_price']})."
                    )

                line_item_audits.append(
                    LineItemAudit(
                        index=int(idx),
                        description=desc,
                        quantity=float(row["quantity"]),
                        unit_price=float(row["unit_price"]),
                        stated_line_total=float(row["stated_line_total"]),
                        computed_line_total=float(row["computed_line_total"]),
                        has_discrepancy=has_disc,
                        discrepancy_amount=disc_amt,
                    )
                )

            # 2. Pandas Subtotal calculation
            calculated_subtotal = float(df["computed_line_total"].sum())

            # 3. Tax calculation: sum of item-level tax or subtotal * stated_tax_rate
            item_level_taxes = (df["computed_line_total"] * df["tax_rate"]).round(2)
            total_item_tax = float(item_level_taxes.sum())

            if total_item_tax > 0.0:
                calculated_tax = round(total_item_tax, 2)
            elif stated_tax_rate is not None and stated_tax_rate > 0.0:
                calculated_tax = round(calculated_subtotal * stated_tax_rate, 2)
            elif stated_tax_amount is not None:
                calculated_tax = round(stated_tax_amount, 2)
            else:
                calculated_tax = 0.0

            # 4. Final grand total
            calculated_total = round(calculated_subtotal + calculated_tax - stated_discount, 2)

        # 5. Check subtotal discrepancy if stated
        if stated_subtotal is not None:
            subtotal_diff = abs(calculated_subtotal - stated_subtotal)
            if subtotal_diff > cls.TOLERANCE:
                discrepancy_notes.append(
                    f"Subtotal discrepancy: Stated subtotal is {stated_subtotal}, "
                    f"but sum of line items is {round(calculated_subtotal, 2)}."
                )

        # 6. Overall Grand Total Reconciliation
        discrepancy = round(abs(calculated_total - stated_total), 2)
        has_total_discrepancy = discrepancy > cls.TOLERANCE

        if has_total_discrepancy:
            math_audit_passed = False
            audit_status = "warning"
            # Confidence score is capped at 0.70 (<0.85) to trigger manual audit UI flag
            confidence_score = min(initial_confidence, 0.70)
            discrepancy_notes.append(
                f"Total reconciliation failure: Stated total is {stated_total}, "
                f"but calculated total is {calculated_total} (difference: {round(calculated_total - stated_total, 2)})."
            )
        else:
            math_audit_passed = True
            audit_status = "verified"
            # Preserve or reinforce high confidence score
            confidence_score = max(initial_confidence, 0.95)

        return MathAuditResult(
            math_audit_passed=math_audit_passed,
            stated_total=stated_total,
            calculated_total=calculated_total,
            stated_subtotal=stated_subtotal,
            calculated_subtotal=calculated_subtotal,
            stated_tax_amount=stated_tax_amount,
            calculated_tax_amount=calculated_tax,
            stated_discount=stated_discount,
            discrepancy_amount=discrepancy,
            confidence_score=confidence_score,
            audit_status=audit_status,
            discrepancy_notes=discrepancy_notes,
            line_item_audits=line_item_audits,
        )
