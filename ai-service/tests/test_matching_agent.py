from app.agents.matcher_agent.agent import matching_agent
from app.core.schemas import (
    CVExtractionResponse,
    MatchedCriterion,
    MatchRequest,
    MissingCriterion,
    PersonalInfo,
)


def test_vector_matcher_fallback_without_llm():
    # Create mock CV
    cv_data = CVExtractionResponse(
        skills=["Java", "Spring Boot", "MySQL", "Docker"],
        personal_info=PersonalInfo(name="Nguyen Van A"),
    )

    # Create mock Job
    job_data = {
        "title": "Backend Developer",
        "required_skills": ["Java", "Spring Boot", "Kubernetes", "AWS"],
    }

    request = MatchRequest(
        application_id="test-123",
        cv_data=cv_data,
        job_data=job_data,
        hr_preferences="Ưu tiên làm việc tại HCM",
    )

    # If API key is not set, this will return vector matching results with 0 for background/bonus
    from unittest.mock import patch

    # The Gemini client is created inside the active async event loop. Disable the API key to
    # exercise the deterministic vector-only fallback without constructing that client.
    vector_result = (
        [
            MatchedCriterion(skill="Java", evidence="CV", match_score=0.95),
            MatchedCriterion(skill="Spring Boot", evidence="CV", match_score=0.91),
        ],
        [
            MissingCriterion(
                skill="Kubernetes", criticality="HIGH", reason="Không có trong CV"
            ),
            MissingCriterion(
                skill="AWS", criticality="HIGH", reason="Không có trong CV"
            ),
        ],
        50.0,
    )
    with (
        patch.object(matching_agent, "api_key", ""),
        patch(
            "app.agents.matcher_agent.agent.vector_matcher.match_skills",
            return_value=vector_result,
        ),
    ):
        result = matching_agent.evaluate(request)

    assert result.hard_skill_score > 0
    assert len(result.matched_criteria) > 0
    assert len(result.missing_criteria) > 0
    # Java and Spring Boot should be matched
    matched_skills = [m.skill for m in result.matched_criteria]
    assert "Java" in matched_skills
    assert "Spring Boot" in matched_skills

    # Kubernetes and AWS should be missing
    missing_skills = [m.skill for m in result.missing_criteria]
    assert "Kubernetes" in missing_skills
    assert "AWS" in missing_skills
