"""
Unit Tests - Model-Agnostic Circuit Breaker & Prompt Mapper
Verifies hot-swapping failover, token cost calculation, circuit breaker states,
and dynamic natural language prompt mapping.
"""

import json
import pytest
from app.extraction_engine.circuit_breaker import (
    CircuitBreaker,
    CircuitState,
    LLMProviderConfig,
    CLAUDE_HAIKU_CONFIG,
    GPT_4O_MINI_CONFIG,
)
from app.extraction_engine.prompts import PromptMapper, BASE_EXTRACTION_SYSTEM_PROMPT


def test_cost_calculation_accuracy():
    """
    Test USD cost calculation formula:
    (input_tokens / 1,000,000 * price_in) + (output_tokens / 1,000,000 * price_out)
    """
    # Haiku: $0.80 / 1M in, $4.00 / 1M out
    # 1,000,000 in + 1,000,000 out = $4.80
    cost = CircuitBreaker.calculate_cost(1_000_000, 1_000_000, CLAUDE_HAIKU_CONFIG)
    assert cost == 4.80

    # 10,000 in, 5,000 out
    # 10,000 * 0.80 / 1M = 0.008
    # 5,000 * 4.00 / 1M = 0.020
    # total = 0.028
    cost_small = CircuitBreaker.calculate_cost(10_000, 5_000, CLAUDE_HAIKU_CONFIG)
    assert cost_small == 0.028


def test_circuit_breaker_primary_success():
    """
    Test that when primary caller succeeds, fallback is not triggered.
    """
    cb = CircuitBreaker(primary_config=CLAUDE_HAIKU_CONFIG, fallback_config=GPT_4O_MINI_CONFIG)

    sample_json = json.dumps({
        "vendor_name": "Test Primary Corp",
        "invoice_number": "INV-PRIMARY-001",
        "invoice_date": "2026-09-01",
        "stated_total": 100.0,
        "line_items": [{"description": "Item", "quantity": 1, "unit_price": 100, "stated_line_total": 100}],
    })

    def mock_primary(config, sys_p, usr_p):
        return sample_json, 500, 250

    result = cb.execute(
        system_prompt="sys",
        user_prompt="usr",
        primary_caller=mock_primary,
    )

    assert result.fallback_triggered is False
    assert result.model_used == CLAUDE_HAIKU_CONFIG.model_id
    assert result.provider == CLAUDE_HAIKU_CONFIG.provider
    assert result.parsed_json["vendor_name"] == "Test Primary Corp"
    assert result.cost_usd > 0.0
    assert cb.state == CircuitState.CLOSED


def test_circuit_breaker_hot_swaps_to_fallback_on_primary_failure():
    """
    Test that when primary raises an exception (e.g. 500 error or timeout),
    the circuit breaker automatically executes the fallback provider.
    """
    cb = CircuitBreaker(
        primary_config=CLAUDE_HAIKU_CONFIG,
        fallback_config=GPT_4O_MINI_CONFIG,
        failure_threshold=3,
    )

    sample_fallback_json = json.dumps({
        "vendor_name": "Test Fallback Corp",
        "invoice_number": "INV-FALLBACK-002",
        "invoice_date": "2026-09-01",
        "stated_total": 250.0,
        "line_items": [{"description": "Service", "quantity": 1, "unit_price": 250, "stated_line_total": 250}],
    })

    def failing_primary(config, sys_p, usr_p):
        raise RuntimeError("Primary 500 Internal Server Error / Timeout")

    def successful_fallback(config, sys_p, usr_p):
        return sample_fallback_json, 600, 300

    result = cb.execute(
        system_prompt="sys",
        user_prompt="usr",
        primary_caller=failing_primary,
        fallback_caller=successful_fallback,
    )

    assert result.fallback_triggered is True
    assert result.model_used == GPT_4O_MINI_CONFIG.model_id
    assert result.provider == GPT_4O_MINI_CONFIG.provider
    assert result.parsed_json["vendor_name"] == "Test Fallback Corp"
    assert cb.failure_count == 1
    assert cb.state == CircuitState.CLOSED  # not yet at threshold 3


def test_circuit_breaker_trips_to_open_after_consecutive_failures():
    """
    Test that consecutive failures trip the circuit breaker into OPEN state,
    causing subsequent calls to bypass primary completely.
    """
    cb = CircuitBreaker(
        primary_config=CLAUDE_HAIKU_CONFIG,
        fallback_config=GPT_4O_MINI_CONFIG,
        failure_threshold=3,
        recovery_timeout=60.0,
    )

    sample_fallback_json = json.dumps({
        "vendor_name": "Fallback Always",
        "invoice_number": "INV-003",
        "invoice_date": "2026-09-01",
        "stated_total": 50.0,
        "line_items": [{"description": "Fee", "quantity": 1, "unit_price": 50, "stated_line_total": 50}],
    })

    primary_call_count = 0

    def failing_primary(config, sys_p, usr_p):
        nonlocal primary_call_count
        primary_call_count += 1
        raise RuntimeError("Primary Down")

    def successful_fallback(config, sys_p, usr_p):
        return sample_fallback_json, 400, 200

    # Trigger 3 failures
    for _ in range(3):
        cb.execute("sys", "usr", primary_caller=failing_primary, fallback_caller=successful_fallback)

    assert cb.state == CircuitState.OPEN
    assert primary_call_count == 3

    # 4th call should bypass primary completely because breaker is OPEN
    res4 = cb.execute("sys", "usr", primary_caller=failing_primary, fallback_caller=successful_fallback)
    assert primary_call_count == 3  # Primary was NOT called!
    assert res4.fallback_triggered is True


def test_natural_language_prompt_mapper():
    """
    Test that PromptMapper correctly combines the base extraction instructions
    with custom natural language user requests.
    """
    doc_text = "Vendor: SolarTech LLC\nInvoice: INV-990\nTotal: 1200.00 USD"
    user_req = "Please extract the Solar Panel serial numbers and customer warranty period."
    custom_fields = ["serial_numbers", "warranty_period"]

    prompts = PromptMapper.build_prompts(
        document_text=doc_text,
        user_instructions=user_req,
        custom_fields=custom_fields,
    )

    # 1. Base prompt must prohibit math calculations
    assert "EXTRACTION ENGINE ONLY" in prompts["system_prompt"]
    assert "DO NOT perform any mathematical calculations" in prompts["system_prompt"]

    # 2. User prompt contains source text and custom instructions
    assert doc_text in prompts["user_prompt"]
    assert user_req in prompts["user_prompt"]
    assert "serial_numbers, warranty_period" in prompts["user_prompt"]
    assert "REQUIRED JSON SCHEMA" in prompts["user_prompt"]
