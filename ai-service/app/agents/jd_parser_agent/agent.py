import difflib
import json
import logging
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.agents.jd_parser_agent.master_data import (
    get_career_levels,
    get_competencies,
    get_job_families,
)
from app.core.config import settings
from app.core.schemas import JDCompetency, JDJobInfo, JDParseRequest, JDParseResponse

logger = logging.getLogger(__name__)


# This schema is used by the LLM to output structured JSON
class LLM_JD_Extraction(BaseModel):
    title: str
    location: str
    employmentType: str
    description: str
    requirements: str
    benefits: str
    jobFamilyName: Optional[str]
    careerLevelName: Optional[str]
    skills: List[str]


def _fuzzy_match(
    query: str, candidates: List[Dict[str, Any]], name_key: str = "name"
) -> Optional[str]:
    """Find the ID of the best matching candidate using simple fuzzy matching."""
    if not query or not candidates:
        return None

    names = [c.get(name_key, "") for c in candidates]
    matches = difflib.get_close_matches(query, names, n=1, cutoff=0.6)

    if matches:
        best_name = matches[0]
        for c in candidates:
            if c.get(name_key) == best_name:
                return c.get("id")
    return None


async def parse_jd_with_llm(request: JDParseRequest) -> JDParseResponse:
    """
    Parses a raw JD text using Google Gemini, then fuzzy-matches
    the extracted job family, career level, and skills to Master Data UUIDs.
    """
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    prompt = f"""
    You are an expert HR system assistant. Extract the following information from the Job Description text.
    Please extract:
    - title: the job title
    - location: the job location
    - employmentType: one of [FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP]
    - description: a summary of the job description
    - requirements: the requirements for the candidate
    - benefits: the benefits offered
    - jobFamilyName: the general category/family of this job (e.g. Software Engineering, Marketing, HR)
    - careerLevelName: the level of the job (e.g. Junior, Senior, Manager, Director)
    - skills: a list of string representing the technical and soft skills required for the job.

    Job Description:
    ----------------
    {request.text}
    ----------------
    """

    logger.info("Calling Gemini LLM for JD Parsing...")
    try:
        response = client.models.generate_content(
            model=settings.LLM_MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=LLM_JD_Extraction,
                temperature=0.1,
            ),
        )
        extracted_data = json.loads(response.text)
        logger.info(f"LLM Extraction successful: {extracted_data.get('title')}")
    except Exception as e:
        logger.error(f"LLM Error during JD Parsing: {e}")
        raise ValueError("Failed to parse JD using LLM.") from e

    # Now we perform semantic/fuzzy matching against Master Data Cache
    job_families = get_job_families()
    career_levels = get_career_levels()
    competencies = get_competencies()

    # Match Job Family
    job_family_id = _fuzzy_match(extracted_data.get("jobFamilyName"), job_families)

    # Match Career Level
    career_level_id = _fuzzy_match(extracted_data.get("careerLevelName"), career_levels)

    # Match Competencies
    matched_competencies = []
    extracted_skills = extracted_data.get("skills", [])

    # Create a fast lookup dict for exact matches first
    comp_name_dict = {c.get("name").lower(): c for c in competencies if c.get("name")}

    for skill in extracted_skills:
        skill_lower = skill.lower()
        matched_id = None

        # 1. Exact match
        if skill_lower in comp_name_dict:
            matched_id = comp_name_dict[skill_lower].get("id")
        else:
            # 2. Fuzzy match
            matched_id = _fuzzy_match(skill, competencies)

        if matched_id:
            # Avoid duplicates
            if not any(c.competencyId == matched_id for c in matched_competencies):
                matched_competencies.append(
                    JDCompetency(
                        competencyId=matched_id,
                        weight=10.0,  # Default weight
                        requiredLevel=3,  # Default level
                        isMandatory=True,  # Default to true for extracted skills
                    )
                )

    # Assemble final response
    job_info = JDJobInfo(
        title=extracted_data.get("title", ""),
        location=extracted_data.get("location", ""),
        employmentType=extracted_data.get("employmentType", "FULL_TIME"),
        description=extracted_data.get("description", ""),
        requirements=extracted_data.get("requirements", ""),
        benefits=extracted_data.get("benefits", ""),
        jobFamilyId=job_family_id,
        careerLevelId=career_level_id,
    )

    return JDParseResponse(jobInfo=job_info, competencies=matched_competencies)
