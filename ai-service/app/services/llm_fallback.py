"""LLM fallback service for CV extraction.

Used when NER model results are insufficient, typically for:
- Vietnamese CVs where BERT NER performs poorly
- Scanned/OCR'd text with low quality
- Missing critical fields (name, email)

Uses Google Gemini API (configurable to swap providers).
"""

import asyncio
import json
import logging
import time
from typing import Optional

from app.config import settings
from app.schemas import (
    CVExtractionResponse,
    ConfidenceScores,
    EducationItem,
    ExperienceItem,
    ExtractionMethod,
    ExtractionStatus,
    PersonalInfo,
    ProcessingLog,
)

logger = logging.getLogger(__name__)

# Rate limit tracking (simple in-memory counter)
_daily_request_count = 0
_last_reset_date: Optional[str] = None

# ── LLM Prompt ──────────────────────────────────────────────────────

CV_EXTRACTION_PROMPT = """You are a CV/Resume parsing expert. Extract structured information from the following CV text.

IMPORTANT RULES:
- Extract ONLY what is explicitly stated in the text. Do NOT infer or guess.
- If a field is not found, use null.
- For skills, extract individual skill names as a flat list.
- For experience, extract each position as a separate entry.
- For education, extract each degree/certification as a separate entry.
- Respond ONLY with valid JSON, no markdown formatting.

Return a JSON object with this exact structure:
{{
    "personal_info": {{
        "name": "Full name or null",
        "email": "Email address or null",
        "phone": "Phone number or null",
        "location": "Location/address or null"
    }},
    "skills": ["skill1", "skill2"],
    "experience": [
        {{
            "title": "Job title or null",
            "company": "Company name or null",
            "duration": "Time period or null",
            "description": "Brief description or null"
        }}
    ],
    "education": [
        {{
            "degree": "Degree name or null",
            "institution": "School/university name or null",
            "year": "Graduation year or null"
        }}
    ],
    "certifications": ["cert1", "cert2"]
}}

CV TEXT:
---
{cv_text}
---

JSON OUTPUT:"""


# ── Retry logic (inlined) ────────────────────────────────────────────


async def _retry_async(func, *args, max_retries=2, base_delay=1.0):
    """Retry an async function with exponential backoff."""
    last_exception = None
    for attempt in range(max_retries + 1):
        try:
            return await func(*args)
        except Exception as e:
            last_exception = e
            if attempt < max_retries:
                delay = min(base_delay * (2 ** attempt), 10.0)
                logger.warning(
                    "Attempt %d/%d failed for %s: %s. Retrying in %.1fs...",
                    attempt + 1, max_retries + 1,
                    func.__name__, str(e), delay,
                )
                await asyncio.sleep(delay)
            else:
                logger.error(
                    "All %d attempts failed for %s: %s",
                    max_retries + 1, func.__name__, str(e),
                )
    raise last_exception  # type: ignore[misc]


# ── Gemini Provider ──────────────────────────────────────────────────


class GeminiProvider:
    """Google Gemini API provider."""

    def __init__(self):
        self._model = None

    def _get_model(self):
        if self._model is None:
            import google.generativeai as genai

            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self._model = genai.GenerativeModel(settings.LLM_MODEL_NAME)
        return self._model

    async def extract_cv_data(self, text: str) -> Optional[dict]:
        """Extract CV data using Gemini API."""
        model = self._get_model()
        prompt = CV_EXTRACTION_PROMPT.format(cv_text=text[:8000])

        try:
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: model.generate_content(prompt),
                ),
                timeout=settings.LLM_TIMEOUT_SECONDS,
            )

            if not response or not response.text:
                logger.warning("Gemini returned empty response")
                return None

            return _parse_llm_json(response.text)

        except asyncio.TimeoutError:
            logger.error(
                "Gemini API timeout after %ds",
                settings.LLM_TIMEOUT_SECONDS,
            )
            return None
        except Exception as e:
            logger.error("Gemini API error: %s", e)
            return None


# ── Rate Limiting ─────────────────────────────────────────────────────


def _check_rate_limit() -> bool:
    """Check if we're within the daily LLM request limit."""
    global _daily_request_count, _last_reset_date

    today = time.strftime("%Y-%m-%d")
    if _last_reset_date != today:
        _daily_request_count = 0
        _last_reset_date = today

    if _daily_request_count >= settings.LLM_DAILY_RATE_LIMIT:
        logger.warning(
            "LLM daily rate limit reached (%d/%d)",
            _daily_request_count,
            settings.LLM_DAILY_RATE_LIMIT,
        )
        return False

    return True


def _increment_rate_limit() -> None:
    """Increment the daily request counter."""
    global _daily_request_count
    _daily_request_count += 1


# ── Main Fallback Function ───────────────────────────────────────────

# Provider instance (singleton)
_provider: Optional[GeminiProvider] = None


def get_provider() -> GeminiProvider:
    """Get or create the LLM provider instance."""
    global _provider
    if _provider is None:
        _provider = GeminiProvider()
    return _provider


async def llm_extract_cv(
    text: str,
    fallback_reason: str,
) -> Optional[CVExtractionResponse]:
    """Extract CV data using LLM as a fallback.

    Args:
        text: The CV text to extract from.
        fallback_reason: Why NER was insufficient (for logging).

    Returns:
        CVExtractionResponse if successful, None if LLM also fails.
    """
    if not settings.GOOGLE_API_KEY:
        logger.warning(
            "LLM fallback requested but no API key configured. "
            "Reason: %s",
            fallback_reason,
        )
        return None

    if not _check_rate_limit():
        logger.warning(
            "LLM fallback skipped due to rate limit. Reason: %s",
            fallback_reason,
        )
        return None

    logger.info("LLM fallback triggered. Reason: %s", fallback_reason)
    _increment_rate_limit()

    provider = get_provider()

    try:
        data = await _retry_async(
            provider.extract_cv_data,
            text,
            max_retries=settings.LLM_MAX_RETRIES,
            base_delay=1.0,
        )
    except Exception as e:
        logger.error("LLM fallback failed after retries: %s", e)
        return None

    if not data:
        return None

    return _convert_llm_output(data, fallback_reason)


def _parse_llm_json(text: str) -> Optional[dict]:
    """Parse JSON from LLM response, handling markdown code blocks."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse LLM JSON: %s", e)
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
        return None


def _convert_llm_output(
    data: dict, fallback_reason: str
) -> CVExtractionResponse:
    """Convert raw LLM JSON output to CVExtractionResponse."""
    personal = data.get("personal_info", {})
    skills = data.get("skills", [])
    experience_raw = data.get("experience", [])
    education_raw = data.get("education", [])
    certifications = data.get("certifications", [])

    personal_info = PersonalInfo(
        name=personal.get("name"),
        email=personal.get("email"),
        phone=personal.get("phone"),
        location=personal.get("location"),
    )

    experience = [
        ExperienceItem(
            title=exp.get("title"),
            company=exp.get("company"),
            duration=exp.get("duration"),
            description=exp.get("description"),
        )
        for exp in experience_raw
        if isinstance(exp, dict)
    ]

    education = [
        EducationItem(
            degree=edu.get("degree"),
            institution=edu.get("institution"),
            year=edu.get("year"),
        )
        for edu in education_raw
        if isinstance(edu, dict)
    ]

    # Determine status
    has_name = bool(personal_info.name)
    has_contact = bool(personal_info.email or personal_info.phone)
    has_skills = len(skills) > 0

    if has_name and has_contact and has_skills:
        status = ExtractionStatus.SUCCESS
    elif has_name or has_contact:
        status = ExtractionStatus.PARTIAL
    else:
        status = ExtractionStatus.FAILED

    return CVExtractionResponse(
        status=status,
        extraction_method=ExtractionMethod.LLM_FALLBACK,
        personal_info=personal_info,
        skills=[s for s in skills if isinstance(s, str)],
        experience=experience,
        education=education,
        certifications=[c for c in certifications if isinstance(c, str)],
        confidence_scores=ConfidenceScores(overall=0.7),
        processing_log=ProcessingLog(
            extraction_method="llm_fallback",
            fallback_reason=fallback_reason,
        ),
    )
