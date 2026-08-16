"""Regression tests for the Gemini CV extraction prompt."""

from app.agents.extractor_agent.llm_fallback import CV_EXTRACTION_PROMPT


def test_cv_extraction_prompt_formats_all_json_examples_as_literals():
    """JSON examples must not be interpreted as ``str.format`` fields."""
    prompt = CV_EXTRACTION_PROMPT.format(cv_text="Jane Doe\njane@example.com")

    assert '"name": "certificate name"' in prompt
    assert "Jane Doe\njane@example.com" in prompt
    assert "{cv_text}" not in prompt
