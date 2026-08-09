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

from app.core.config import settings
from app.core.schemas import (
    CategorizedSkills,
    CertificationItem,
    ConfidenceScores,
    CVExtractionResponse,
    EducationItem,
    ExperienceItem,
    ExtractionMethod,
    ExtractionStatus,
    LanguageProficiency,
    PersonalInfo,
    ProcessingLog,
    ProfessionalMetadata,
    ProjectItem,
    SocialLinks,
)

logger = logging.getLogger(__name__)

# Rate limit tracking (simple in-memory counter)
_daily_request_count = 0
_last_reset_date: Optional[str] = None

# ── LLM Prompt ──────────────────────────────────────────────────────

CV_EXTRACTION_PROMPT = """You are a CV/Resume parsing expert. Extract structured information from the following CV text.

IMPORTANT RULES:
- Extract ONLY what is explicitly stated in the text. Do NOT infer or guess unless necessary for categorizing skills.
- If a field is not found, use null or an empty array.
- Categorize skills intelligently based on the profession (e.g., industry knowledge, tools/software, soft skills).
- Normalize keywords to lowercase.
- Respond ONLY with valid JSON, no markdown formatting.

Return a JSON object with this exact structure:
{{
    "personal_info": {{
        "name": "Full name or null",
        "email": "Email address or null",
        "phone": "Phone number or null",
        "location": "Location/address or null"
    }},
    "social_links": {{
        "linkedin": "url or null",
        "portfolio_or_website": "url or null",
        "other_links": ["url1", "url2"]
    }},
    "professional_metadata": {{
        "primary_role": "Main profession/role",
        "seniority_level": "Intern/Fresher/Junior/Mid-Level/Senior/Manager/Director",
        "total_years_of_experience": 0.0,
        "candidate_summary": "2-3 sentences summary",
        "industries": ["industry1", "industry2"]
    }},
    "categorized_skills": {{
        "industry_knowledge_and_hard_skills": ["skill1", "skill2"],
        "tools_and_software": ["tool1", "tool2"],
        "soft_skills": ["skill1", "skill2"]
    }},
    "spoken_languages": [
        {{ "language": "name", "proficiency": "level or null" }}
    ],
    "normalized_keywords": ["keyword1", "keyword2"],
    "experience": [
        {{
            "title": "Job title or null",
            "company": "Company name or null",
            "duration": "Time period or null",
            "description": "Brief description or null",
            "employment_type": "Full-time/Part-time/Freelance or null",
            "start_date": "YYYY-MM or null",
            "end_date": "YYYY-MM or null",
            "location": "Location or null",
            "summary": "Short summary of role",
            "responsibilities": ["resp1", "resp2"],
            "achievements": ["ach1", "ach2"],
            "technologies": ["tech1", "tech2"],
            "business_domain": "domain or null"
        }}
    ],
    "education": [
        {{
            "degree": "Degree name or null",
            "institution": "School/university name or null",
            "year": "Graduation year or null",
            "gpa": "numeric GPA or null",
            "gpa_scale": "numeric scale such as 4.0 or 10.0 or null"
        }}
    ],
    "projects": [
        {{
            "name": "Project name or null",
            "summary": "Short summary",
            "role": "Role in project",
            "responsibilities": ["resp1", "resp2"],
            "technologies": ["tech1", "tech2"],
            "team_size": "size or null",
            "duration": "duration or null",
            "achievements": ["ach1", "ach2"],
            "url": "Project url or null"
        }}
    ],
    "certifications": [
        {"name": "certificate name", "issuer": "issuing organization or null", "credential_id": "id or null", "issued_at": "YYYY-MM or null", "expires_at": "YYYY-MM or null"}
    ]
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
                delay = min(base_delay * (2**attempt), 10.0)
                logger.warning(
                    "Attempt %d/%d failed for %s: %s. Retrying in %.1fs...",
                    attempt + 1,
                    max_retries + 1,
                    func.__name__,
                    str(e),
                    delay,
                )
                await asyncio.sleep(delay)
            else:
                logger.error(
                    "All %d attempts failed for %s: %s",
                    max_retries + 1,
                    func.__name__,
                    str(e),
                )
    raise last_exception  # type: ignore[misc]


# ── Gemini Provider ──────────────────────────────────────────────────


class GeminiProvider:
    """Google Gemini API provider using google.genai SDK."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        return self._client

    async def extract_cv_data(self, text: str) -> Optional[dict]:
        """Extract CV data using Gemini API asynchronously."""
        if not settings.GOOGLE_API_KEY:
            logger.warning("GOOGLE_API_KEY not configured for LLM fallback")
            return None

        client = self._get_client()
        prompt = CV_EXTRACTION_PROMPT.format(cv_text=text[:8000])

        try:
            from google.genai import types

            config = types.GenerateContentConfig(response_mime_type="application/json")
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=settings.LLM_MODEL_NAME,
                    contents=prompt,
                    config=config,
                ),
                timeout=settings.LLM_TIMEOUT_SECONDS,
            )

            if not response or not response.text:
                raise ValueError("Gemini returned empty response")

            result = _parse_llm_json(response.text)
            if not result:
                raise ValueError("Failed to parse JSON from LLM")
            return result

        except asyncio.TimeoutError as err:
            raise ValueError(
                f"Gemini API timeout after {settings.LLM_TIMEOUT_SECONDS}s"
            ) from err


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
            "LLM fallback requested but no API key configured. Reason: %s",
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
        raise ValueError(f"Could not extract valid JSON. Error: {e}") from e


def _convert_llm_output(data: dict, fallback_reason: str) -> CVExtractionResponse:
    """Convert raw LLM JSON output to CVExtractionResponse."""
    personal = data.get("personal_info", {})
    social = data.get("social_links", {})
    metadata = data.get("professional_metadata", {})
    cat_skills = data.get("categorized_skills", {})
    spoken = data.get("spoken_languages", [])
    keywords = data.get("normalized_keywords", [])

    experience_raw = data.get("experience", [])
    education_raw = data.get("education", [])
    projects_raw = data.get("projects", [])
    certifications = data.get("certifications", [])

    personal_info = PersonalInfo(
        name=personal.get("name"),
        email=personal.get("email"),
        phone=personal.get("phone"),
        location=personal.get("location"),
    )

    social_links = SocialLinks(
        linkedin=social.get("linkedin"),
        portfolio_or_website=social.get("portfolio_or_website"),
        other_links=social.get("other_links", []),
    )

    professional_metadata = ProfessionalMetadata(
        primary_role=metadata.get("primary_role"),
        seniority_level=metadata.get("seniority_level"),
        total_years_of_experience=float(metadata.get("total_years_of_experience", 0.0)),
        candidate_summary=metadata.get("candidate_summary"),
        industries=metadata.get("industries", []),
    )

    categorized_skills = CategorizedSkills(
        industry_knowledge_and_hard_skills=cat_skills.get(
            "industry_knowledge_and_hard_skills", []
        ),
        tools_and_software=cat_skills.get("tools_and_software", []),
        soft_skills=cat_skills.get("soft_skills", []),
    )

    spoken_languages = [
        LanguageProficiency(
            language=lang.get("language", ""), proficiency=lang.get("proficiency")
        )
        for lang in spoken
        if isinstance(lang, dict) and "language" in lang
    ]

    experience = [
        ExperienceItem(
            title=exp.get("title"),
            company=exp.get("company"),
            duration=exp.get("duration"),
            description=exp.get("description"),
            employment_type=exp.get("employment_type"),
            start_date=exp.get("start_date"),
            end_date=exp.get("end_date"),
            location=exp.get("location"),
            summary=exp.get("summary"),
            responsibilities=exp.get("responsibilities", []),
            achievements=exp.get("achievements", []),
            technologies=exp.get("technologies", []),
            business_domain=exp.get("business_domain"),
        )
        for exp in experience_raw
        if isinstance(exp, dict)
    ]

    education = [
        EducationItem(
            degree=edu.get("degree"),
            institution=edu.get("institution"),
            year=edu.get("year"),
            gpa=edu.get("gpa"),
            gpa_scale=edu.get("gpa_scale"),
        )
        for edu in education_raw
        if isinstance(edu, dict)
    ]

    projects = [
        ProjectItem(
            name=proj.get("name"),
            summary=proj.get("summary"),
            role=proj.get("role"),
            responsibilities=proj.get("responsibilities", []),
            technologies=proj.get("technologies", []),
            team_size=proj.get("team_size"),
            duration=proj.get("duration"),
            achievements=proj.get("achievements", []),
            url=proj.get("url"),
        )
        for proj in projects_raw
        if isinstance(proj, dict)
    ]

    # Backward compatibility for flat skills array
    flat_skills = []
    flat_skills.extend(categorized_skills.industry_knowledge_and_hard_skills)
    flat_skills.extend(categorized_skills.tools_and_software)
    flat_skills.extend(categorized_skills.soft_skills)

    # Determine status
    has_name = bool(personal_info.name)
    has_contact = bool(personal_info.email or personal_info.phone)
    has_skills = len(flat_skills) > 0

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
        social_links=social_links,
        professional_metadata=professional_metadata,
        categorized_skills=categorized_skills,
        spoken_languages=spoken_languages,
        normalized_keywords=keywords,
        skills=list(set(flat_skills)),
        experience=experience,
        education=education,
        projects=projects,
        certifications=[
            CertificationItem(name=item)
            if isinstance(item, str)
            else CertificationItem(**item)
            for item in certifications
            if isinstance(item, (str, dict))
        ],
        confidence_scores=ConfidenceScores(overall=0.8),
        processing_log=ProcessingLog(
            extraction_method="llm",
            fallback_reason=fallback_reason,
        ),
    )
