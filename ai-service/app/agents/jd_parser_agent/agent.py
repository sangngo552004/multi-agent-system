import json
import logging
from typing import List, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.agents.jd_parser_agent.master_data import (
    get_career_levels,
    get_competencies,
    get_job_families,
    get_rules,
)
from app.core.config import settings
from app.core.schemas import (
    JDCompetencyProposal,
    JDJobInfo,
    JDParseRequest,
    JDParseResponse,
    JDRuleSuggestion,
)

logger = logging.getLogger(__name__)


# This schema is used by the LLM to output structured JSON
class LLM_JD_Extraction(BaseModel):
    title: str
    location: str
    employmentType: str
    description: str
    requirements: str
    benefits: str
    jobFamilyId: Optional[str]
    careerLevelId: Optional[str]
    competencyProposals: List[JDCompetencyProposal]
    suggestedRuleIds: List[str] = []


async def parse_jd_with_llm(request: JDParseRequest) -> JDParseResponse:
    """
    Parses a raw JD text using Google Gemini, then fuzzy-matches
    the extracted job family, career level, and skills to Master Data UUIDs.
    """
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    job_families = get_job_families()
    career_levels = get_career_levels()
    competencies = get_competencies()
    rules = get_rules()
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
    - competencyProposals: use competencyId ONLY from the supplied catalog when it exists; otherwise set status=PROPOSED_NEW and competencyId=null.
    - suggestedRuleIds: choose ONLY IDs from the supplied active rule catalog.

    COMPETENCY CATALOG: {json.dumps(competencies, ensure_ascii=False)}
    JOB FAMILY CATALOG: {json.dumps(job_families, ensure_ascii=False)}
    CAREER LEVEL CATALOG: {json.dumps(career_levels, ensure_ascii=False)}
    ACTIVE RULE CATALOG: {json.dumps(rules, ensure_ascii=False)}

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

    valid_competency_ids = {item.get("id") for item in competencies}
    proposals = []
    for item in extracted_data.get("competencyProposals", []):
        proposal = JDCompetencyProposal(**item)
        if proposal.competencyId and proposal.competencyId not in valid_competency_ids:
            proposal.competencyId = None
            proposal.status = "PROPOSED_NEW"
        proposals.append(proposal)

    # Assemble final response
    job_info = JDJobInfo(
        title=extracted_data.get("title", ""),
        location=extracted_data.get("location", ""),
        employmentType=extracted_data.get("employmentType", "FULL_TIME"),
        description=extracted_data.get("description", ""),
        requirements=extracted_data.get("requirements", ""),
        benefits=extracted_data.get("benefits", ""),
        jobFamilyId=extracted_data.get("jobFamilyId"),
        careerLevelId=extracted_data.get("careerLevelId"),
    )

    valid_rule_ids = {item.get("id") for item in rules}
    suggested_rules = [
        JDRuleSuggestion(ruleId=item, reason="Suggested by JD parser")
        for item in extracted_data.get("suggestedRuleIds", [])
        if item in valid_rule_ids
    ]
    return JDParseResponse(
        jobInfo=job_info, competencyProposals=proposals, suggestedRules=suggested_rules
    )
