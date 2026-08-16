"""Regression tests for the Gemini JD parser response schema."""

import json

from app.agents.jd_parser_agent.agent import LLM_JD_Extraction


def test_jd_parser_schema_uses_gemini_supported_numeric_bounds():
    """Gemini Schema accepts minimum/maximum, not exclusiveMinimum."""
    schema = LLM_JD_Extraction.model_json_schema()
    serialized_schema = json.dumps(schema)
    weight_schema = schema["$defs"]["JDCompetencyProposal"]["properties"]["weight"]

    assert "exclusiveMinimum" not in serialized_schema
    assert weight_schema["minimum"] == 1
    assert weight_schema["maximum"] == 100
