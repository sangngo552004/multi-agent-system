from app.agents.matcher_agent.agent import matching_agent
from app.core.schemas import CVExtractionResponse, MatchRequest, PersonalInfo


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

    with patch.object(matching_agent, "client", None):
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
