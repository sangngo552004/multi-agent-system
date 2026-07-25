"""LLM enrichment service for Experience and Projects extraction.

Separate from llm_fallback.py which *replaces* NER when it fails.
This module *enriches* the output with fields NER cannot provide:
- Experience: employment_type, start/end dates, location, summary,
  responsibilities, achievements, technologies, business_domain
- Projects: full project section which NER has no labels for

Uses Google Gemini Flash in a single prompt for both sections.
"""

import asyncio
import json
import logging
import time
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Rate limit state (in-memory, per-process) ─────────────────────────
_enricher_daily_count = 0
_enricher_last_reset: Optional[str] = None

# ── Prompt ────────────────────────────────────────────────────────────

_ENRICHMENT_PROMPT = """\
You are a CV/Resume parsing expert. From the CV text below, extract structured \
information for the EXPERIENCE, PROJECTS, SKILLS, and EDUCATION sections.

STRICT RULES:
- Extract ONLY what is explicitly stated in the CV. Do NOT infer, guess, or fabricate.
- For "summary": Write 2-5 sentences synthesising what the candidate did, \
the business/product context, their primary responsibilities, their main technical \
contributions, and any notable achievements or impact. Base ONLY on CV content.
- For arrays: return [] if nothing found.
- For string fields: return null if the field is not mentioned.
- skills: extract as a flat list of individual skill/technology names.
- Respond ONLY with valid JSON matching the schema below - no markdown, no explanation.

JSON SCHEMA:
{{
  "skills": ["string"],
  "experience": [
    {{
      "company": "string or null",
      "position": "string or null",
      "employment_type": "Full-time | Part-time | Internship | Contract | Freelance | null",
      "start_date": "string or null",
      "end_date": "string or null",
      "location": "string or null",
      "summary": "string or null",
      "responsibilities": ["string"],
      "achievements": ["string"],
      "technologies": ["string"],
      "business_domain": "string or null"
    }}
  ],
  "education": [
    {{
      "degree": "string or null",
      "institution": "string or null",
      "year": "string or null"
    }}
  ],
  "projects": [
    {{
      "name": "string or null",
      "summary": "string or null",
      "description": "string or null",
      "role": "string or null",
      "responsibilities": ["string"],
      "technologies": ["string"],
      "team_size": "string or null",
      "duration": "string or null",
      "achievements": ["string"],
      "url": "string or null"
    }}
  ]
}}

CV TEXT:
---
{cv_text}
---

JSON OUTPUT:"""


# ── Helpers ───────────────────────────────────────────────────────────


def _check_enricher_rate_limit() -> bool:
    """Return True if we are within the daily enricher request limit."""
    global _enricher_daily_count, _enricher_last_reset

    today = time.strftime("%Y-%m-%d")
    if _enricher_last_reset != today:
        _enricher_daily_count = 0
        _enricher_last_reset = today

    if _enricher_daily_count >= settings.LLM_ENRICHER_DAILY_LIMIT:
        logger.warning(
            "LLM enricher daily limit reached (%d/%d). Skipping enrichment.",
            _enricher_daily_count,
            settings.LLM_ENRICHER_DAILY_LIMIT,
        )
        return False
    return True


def _increment_enricher_count() -> None:
    global _enricher_daily_count
    _enricher_daily_count += 1


def _parse_enricher_json(raw: str) -> Optional[dict]:
    """Parse JSON from LLM response, stripping optional markdown fences."""
    text = raw.strip()
    # Strip ```json ... ``` fences if present
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.warning(
            "Enricher JSON parse failed (%s). Attempting substring extract.", exc
        )
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
    return None


def _safe_str_list(value) -> list[str]:
    """Ensure value is a list of non-empty strings."""
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if item and str(item).strip()]


# ── Gemini call ───────────────────────────────────────────────────────


async def _call_gemini(cv_text: str) -> Optional[dict]:
    """Send the enrichment prompt to Gemini and return parsed dict."""
    try:
        import google.generativeai as genai
        from google.generativeai.types import GenerationConfig
    except ImportError:
        logger.error(
            "google-generativeai not installed. Cannot run LLM enrichment."
        )
        return None

    genai.configure(api_key=settings.GOOGLE_API_KEY)
    model = genai.GenerativeModel(settings.LLM_MODEL_NAME)

    # Truncate CV text to avoid exceeding context window (~32k chars safe limit)
    prompt = _ENRICHMENT_PROMPT.format(cv_text=cv_text[:12_000])

    loop = asyncio.get_event_loop()
    try:
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: model.generate_content(
                    prompt,
                    generation_config=GenerationConfig(
                        response_mime_type="application/json"
                    ),
                ),
            ),
            timeout=settings.LLM_ENRICHER_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.error(
            "LLM enricher timed out after %ds.",
            settings.LLM_ENRICHER_TIMEOUT_SECONDS,
        )
        return None
    except Exception as exc:
        logger.error("LLM enricher Gemini call failed: %s", exc)
        return None

    if not response or not response.text:
        logger.warning("LLM enricher: Gemini returned empty response.")
        return None

    return _parse_enricher_json(response.text)


async def _call_gemini_with_retry(cv_text: str) -> Optional[dict]:
    """Wrap Gemini call with exponential-backoff retry."""
    last_exc: Optional[Exception] = None
    for attempt in range(settings.LLM_MAX_RETRIES + 1):
        try:
            result = await _call_gemini(cv_text)
            return result  # May be None (non-exception failure); caller handles it
        except Exception as exc:
            last_exc = exc
            if attempt < settings.LLM_MAX_RETRIES:
                delay = min(1.5**attempt, 8.0)
                logger.warning(
                    "Enricher attempt %d/%d failed: %s. Retrying in %.1fs...",
                    attempt + 1,
                    settings.LLM_MAX_RETRIES + 1,
                    exc,
                    delay,
                )
                await asyncio.sleep(delay)
    if last_exc:
        logger.error("All enricher attempts exhausted: %s", last_exc)
    return None


# ── Public API ────────────────────────────────────────────────────────


async def enrich_experience_and_projects(
    cv_text: str,
) -> tuple[list[dict], list[dict], list[str], list[dict]]:
    """Extract rich Experience, Projects, Skills and Education from CV text via Gemini.

    Returns:
        A 4-tuple ``(experience_list, projects_list, skills_list, education_list)``.
        All lists are **empty** when enrichment is skipped or the LLM call fails.

    Raises:
        Does NOT raise; all errors are caught and logged internally.
    """
    if not settings.ENABLE_LLM_ENRICHMENT:
        logger.debug("LLM enrichment disabled via config.")
        return [], [], [], []

    if not settings.GOOGLE_API_KEY:
        logger.warning(
            "LLM enrichment skipped: GOOGLE_API_KEY is not configured."
        )
        return [], [], [], []

    if not _check_enricher_rate_limit():
        return [], [], [], []

    if not cv_text or len(cv_text.strip()) < 50:
        logger.warning("LLM enrichment skipped: CV text too short.")
        return [], [], [], []

    _increment_enricher_count()
    logger.info(
        "Running LLM enrichment (enricher request #%d today).",
        _enricher_daily_count,
    )

    data = await _call_gemini_with_retry(cv_text)

    if not data:
        logger.warning("LLM enrichment produced no data.")
        return [], [], [], []

    # --- Normalize skills (flat list) ---
    raw_skills: list[str] = _safe_str_list(data.get("skills", []))

    # --- Normalize experience ---
    raw_experience: list[dict] = []
    for item in data.get("experience", []):
        if not isinstance(item, dict):
            continue
        raw_experience.append(
            {
                "company": item.get("company") or None,
                "position": item.get("position") or None,
                "employment_type": item.get("employment_type") or None,
                "start_date": item.get("start_date") or None,
                "end_date": item.get("end_date") or None,
                "location": item.get("location") or None,
                "summary": item.get("summary") or None,
                "responsibilities": _safe_str_list(item.get("responsibilities")),
                "achievements": _safe_str_list(item.get("achievements")),
                "technologies": _safe_str_list(item.get("technologies")),
                "business_domain": item.get("business_domain") or None,
            }
        )

    # --- Normalize education ---
    raw_education: list[dict] = []
    for item in data.get("education", []):
        if not isinstance(item, dict):
            continue
        raw_education.append(
            {
                "degree": item.get("degree") or None,
                "institution": item.get("institution") or None,
                "year": item.get("year") or None,
            }
        )

    # --- Normalize projects ---
    raw_projects: list[dict] = []
    for item in data.get("projects", []):
        if not isinstance(item, dict):
            continue
        raw_projects.append(
            {
                "name": item.get("name") or None,
                "summary": item.get("summary") or None,
                "description": item.get("description") or None,
                "role": item.get("role") or None,
                "responsibilities": _safe_str_list(item.get("responsibilities")),
                "technologies": _safe_str_list(item.get("technologies")),
                "team_size": item.get("team_size") or None,
                "duration": item.get("duration") or None,
                "achievements": _safe_str_list(item.get("achievements")),
                "url": item.get("url") or None,
            }
        )

    logger.info(
        "LLM enrichment done: %d experience, %d projects, %d skills, %d education.",
        len(raw_experience),
        len(raw_projects),
        len(raw_skills),
        len(raw_education),
    )
    return raw_experience, raw_projects, raw_skills, raw_education
