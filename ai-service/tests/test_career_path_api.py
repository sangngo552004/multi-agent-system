import json
from unittest.mock import AsyncMock, patch

from starlette.requests import Request

from app.core.schemas import (
    CareerPathDiagnostics,
    CareerPathOutput,
    CareerPathProvenance,
    CareerPathStatus,
    DecisionOutcome,
    DeliveryStatus,
)


def _output(request, *, status=CareerPathStatus.GENERATED):
    delivery = (
        DeliveryStatus.ELIGIBLE
        if status == CareerPathStatus.GENERATED
        else DeliveryStatus.BLOCKED
    )
    return CareerPathOutput(
        status=status,
        delivery_status=delivery,
        application_id=request.application_id,
        decision_id=request.decision.decision_id,
        target_job=request.job,
        diagnostics=CareerPathDiagnostics(data_quality="SUFFICIENT"),
        provenance=CareerPathProvenance(
            agent_version="test",
            policy_version=request.policy.version,
            decision_id=request.decision.decision_id,
            job_snapshot_version=request.job.snapshot_version,
            candidate_snapshot_version=request.candidate.snapshot_version,
            matching_snapshot_version=request.matching.snapshot_version,
        ),
    )


def test_generate_career_path_returns_response_contract(
    test_client, career_path_request
):
    expected = _output(career_path_request)
    mock_generate = AsyncMock(return_value=expected)

    with patch(
        "app.main.career_path_agent.generate", mock_generate
    ):
        response = test_client.post(
            "/generate-career-path",
            json=career_path_request.model_dump(mode="json"),
        )

    assert response.status_code == 200
    assert response.json()["status"] == "GENERATED"
    assert response.json()["delivery_status"] == "ELIGIBLE"
    mock_generate.assert_awaited_once()


def test_invalid_request_returns_sanitized_422(test_client, career_path_request):
    payload = career_path_request.model_dump(mode="json")
    payload.pop("decision")

    response = test_client.post("/generate-career-path", json=payload)

    assert response.status_code == 422
    assert response.json() == {
        "status": "error",
        "error_code": "REQUEST_VALIDATION_ERROR",
        "message": "Request payload is invalid.",
    }


def test_raw_upstream_and_hr_fields_are_rejected_without_echoing_pii(
    test_client, career_path_request
):
    payload = career_path_request.model_dump(mode="json")
    payload["cv_data"] = {
        "personal_info": {"email": "private-candidate@example.com"}
    }
    payload["matching"]["hr_recommendation"] = "private HR rationale"

    response = test_client.post("/generate-career-path", json=payload)
    body = response.text

    assert response.status_code == 422
    assert "private-candidate@example.com" not in body
    assert "private HR rationale" not in body
    assert "personal_info" not in body


def test_accepted_decision_returns_not_applicable_without_model(
    test_client, career_path_request
):
    request = career_path_request.model_copy(deep=True)
    request.decision.outcome = DecisionOutcome.ACCEPTED

    response = test_client.post(
        "/generate-career-path", json=request.model_dump(mode="json")
    )

    assert response.status_code == 200
    assert response.json()["status"] == "NOT_APPLICABLE"
    assert response.json()["delivery_status"] == "BLOCKED"
    assert response.json()["candidate_view"] is None


def test_feature_flag_off_fails_closed(test_client, career_path_request):
    with (
        patch("app.main.career_path_agent.enabled", False),
        patch("app.main.career_path_agent.model", None),
    ):
        response = test_client.post(
            "/generate-career-path",
            json=career_path_request.model_dump(mode="json"),
        )

    data = response.json()
    assert response.status_code == 200
    assert data["status"] == "NEEDS_HUMAN_REVIEW"
    assert data["delivery_status"] == "BLOCKED"
    assert data["internal_draft"] is not None
    assert data["candidate_view"] is None
    assert data["diagnostics"]["fallback_reason"] == "FEATURE_DISABLED"


def test_unexpected_agent_error_uses_career_path_error_shape(
    test_client, career_path_request
):
    mock_generate = AsyncMock(
        side_effect=RuntimeError(
            "secret-token private-candidate@example.com 0901234567"
        )
    )

    with patch("app.main.career_path_agent.generate", mock_generate):
        response = test_client.post(
            "/generate-career-path",
            json=career_path_request.model_dump(mode="json"),
        )

    body = response.text
    assert response.status_code == 500
    assert response.json() == {
        "status": "error",
        "error_code": "CAREER_PATH_INTERNAL_ERROR",
        "message": "Unable to generate career path.",
    }
    assert "personal_info" not in body
    assert "extraction_method" not in body
    assert "secret-token" not in body
    assert "private-candidate@example.com" not in body


async def test_global_error_handler_is_generic_and_redacted():
    from app.main import global_exception_handler

    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/unexpected",
            "headers": [],
            "query_string": b"",
            "scheme": "http",
            "server": ("testserver", 80),
            "client": ("testclient", 50000),
        }
    )
    response = await global_exception_handler(
        request,
        RuntimeError("private-candidate@example.com secret-token"),
    )
    body = json.loads(response.body)

    assert response.status_code == 500
    assert body == {
        "status": "error",
        "error_code": "INTERNAL_SERVER_ERROR",
        "message": "The service could not complete the request.",
    }
    assert "personal_info" not in response.body.decode()
    assert "private-candidate@example.com" not in response.body.decode()
