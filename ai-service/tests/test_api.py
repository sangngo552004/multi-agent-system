"""Tests for FastAPI REST endpoints."""

from unittest.mock import patch

from app.core.schemas import (
    CVExtractionResponse,
    ExtractionStatus,
    PersonalInfo,
)


class TestAPI:
    """Test suite for REST API endpoints."""

    def test_root_endpoint(self, test_client):
        """Root endpoint returns service status."""
        response = test_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "running" in data["message"].lower()

    def test_health_endpoint(self, test_client):
        """Health endpoint returns service health."""
        response = test_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data

    def test_model_health_endpoint(self, test_client):
        """Model health endpoint returns model details."""
        response = test_client.get("/health/model")
        assert response.status_code == 200
        data = response.json()
        assert "model_name" in data
        assert "confidence_threshold" in data
        assert "max_file_size_mb" in data

    @patch("app.services.cv_pipeline.process_cv")
    def test_extract_cv_success(self, mock_process, test_client):
        """Upload CV returns extraction result."""
        mock_response = CVExtractionResponse(
            status=ExtractionStatus.SUCCESS,
            personal_info=PersonalInfo(name="John Doe", email="john@email.com"),
            skills=["Python", "Java"],
        )
        mock_process.return_value = mock_response

        import io

        # Create a minimal file to upload

        buf = io.BytesIO(b"%PDF-1.4\nsome content\n%%EOF")
        response = test_client.post(
            "/extract-cv",
            files={"file": ("resume.pdf", buf, "application/pdf")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["personal_info"]["name"] == "John Doe"

    def test_extract_cv_no_file(self, test_client):
        """Missing file upload returns 422."""
        response = test_client.post("/extract-cv")
        assert response.status_code == 422

    @patch("app.services.cv_pipeline.process_cv")
    def test_extract_cv_returns_partial(self, mock_process, test_client):
        """Partial extraction returns status=partial."""
        mock_response = CVExtractionResponse(
            status=ExtractionStatus.PARTIAL,
            personal_info=PersonalInfo(name="Jane"),
            warnings=["missing_email", "missing_phone"],
        )
        mock_process.return_value = mock_response

        import io

        buf = io.BytesIO(b"%PDF-1.4\ncontent\n%%EOF")
        response = test_client.post(
            "/extract-cv",
            files={"file": ("cv.pdf", buf, "application/pdf")},
        )

        data = response.json()
        assert data["status"] == "partial"
        assert "missing_email" in data["warnings"]
