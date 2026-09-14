"""
Extraction Engine - Prompts & Prompt Mapping
Defines base strict-extraction prompts and natural language prompt mapping.
Enforces complete separation between raw LLM extraction and deterministic math computation.
"""

import json
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


BASE_EXTRACTION_SYSTEM_PROMPT = """You are an enterprise financial document extraction model.
CRITICAL MANDATE - READ CAREFULLY:
1. You are an EXTRACTION ENGINE ONLY. DO NOT perform any mathematical calculations, infer totals, multiply unit prices by quantities, or balance the ledger.
2. Extract EXACT verbatim text and numbers as they appear printed on the document.
3. If a number is printed incorrectly or line items do not add up on the physical document, extract the EXACT written numbers regardless. Do not "fix" math mistakes.
4. Extract line items verbatim: description, quantity, unit_price, line_total.
5. If a field or value is not present or cannot be read with certainty, return null for that field. Do not invent or guess data.
6. Output MUST be strictly valid JSON adhering to the specified schema, without any markdown formatting, code fences, commentary, or extra text.
"""

DEFAULT_EXTRACTION_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "vendor_name": {"type": "string", "description": "Name of the issuing vendor/company"},
        "vendor_address": {"type": "string", "description": "Address or contact details of the vendor"},
        "vendor_tax_id": {"type": "string", "description": "Vendor Tax/VAT ID or Commercial Registry if present"},
        "customer_name": {"type": "string", "description": "Name of the billed customer/client"},
        "invoice_number": {"type": "string", "description": "Invoice, bill, or receipt reference number"},
        "invoice_date": {"type": "string", "description": "Date of invoice issue (YYYY-MM-DD format if possible)"},
        "due_date": {"type": "string", "description": "Payment due date if present"},
        "currency": {"type": "string", "description": "Currency code or symbol (e.g., USD, EUR, EGP, SAR)"},
        "stated_subtotal": {"type": "number", "description": "Subtotal before taxes/discounts printed on invoice"},
        "stated_tax_rate": {"type": "number", "description": "Tax percentage or VAT rate (e.g. 0.14 for 14%) if explicitly stated"},
        "stated_tax_amount": {"type": "number", "description": "Total tax or VAT amount explicitly printed on invoice"},
        "stated_discount": {"type": "number", "description": "Total discount amount printed on invoice, if any"},
        "stated_total": {"type": "number", "description": "Final Grand Total amount explicitly printed on the document"},
        "line_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": {"type": "string", "description": "Line item description or service title"},
                    "quantity": {"type": "number", "description": "Quantity purchased/billed"},
                    "unit_price": {"type": "number", "description": "Price per unit as printed"},
                    "stated_line_total": {"type": "number", "description": "Total for this line item as printed on the document"},
                    "tax_rate": {"type": "number", "description": "Tax rate for this item if specified"},
                    "confidence": {"type": "number", "description": "Extraction confidence for this line between 0.0 and 1.0"}
                },
                "required": ["description", "quantity", "unit_price", "stated_line_total"]
            }
        },
        "custom_fields": {
            "type": "object",
            "description": "Additional custom extracted fields specified by user prompt"
        }
    },
    "required": ["vendor_name", "invoice_number", "invoice_date", "stated_total", "line_items"]
}


class PromptMapper:
    """
    Dynamically merges the system base extraction prompt with user-specified natural language requests,
    mapping custom user instructions into structured JSON schemas.
    """

    @staticmethod
    def build_prompts(
        document_text: str,
        user_instructions: Optional[str] = None,
        custom_fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Builds the system prompt and user prompt payload.
        Dynamically adapts schema instructions if custom user instructions are provided.
        """
        system_prompt = BASE_EXTRACTION_SYSTEM_PROMPT

        user_content_parts = []
        user_content_parts.append("--- SOURCE DOCUMENT TEXT ---")
        user_content_parts.append(document_text)
        user_content_parts.append("--- END SOURCE DOCUMENT TEXT ---")

        schema_copy = dict(DEFAULT_EXTRACTION_SCHEMA)

        if user_instructions or custom_fields:
            user_content_parts.append("\n--- SPECIAL EXTRACTION INSTRUCTIONS ---")
            if user_instructions:
                user_content_parts.append(f"User Request: {user_instructions.strip()}")
            if custom_fields:
                user_content_parts.append(
                    f"Please extract the following extra custom fields into the 'custom_fields' dictionary: {', '.join(custom_fields)}"
                )
            user_content_parts.append(
                "Incorporate any additional requested fields into the 'custom_fields' key as key-value pairs verbatim."
            )

        user_content_parts.append("\n--- REQUIRED JSON SCHEMA ---")
        user_content_parts.append(json.dumps(schema_copy, indent=2))
        user_content_parts.append(
            "\nReturn ONLY the raw JSON object. No other text."
        )

        return {
            "system_prompt": system_prompt,
            "user_prompt": "\n".join(user_content_parts),
            "json_schema": schema_copy,
        }
