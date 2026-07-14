"""Tests for cv_pipeline orchestrator (includes normalizer logic)."""

from unittest.mock import MagicMock, patch

import pytest

from app.schemas import (
    DetectedLanguage,
    ExtractionMethod,
    ExtractionStatus,
    NEREntity,
    TextExtractionResult,
)
from app.services.cv_pipeline import _normalize_output


class TestOutputNormalizer:
    """Test suite for output normalization."""

    def test_full_extraction_success(self, mock_ner_entities):
        """Full extraction with all fields returns SUCCESS status."""
        text_result = TextExtractionResult(text="some text", method="pdfplumber")

        response = _normalize_output(
            entities=mock_ner_entities,
            text_result=text_result,
            detected_lang=DetectedLanguage.EN,
        )

        assert response.status == ExtractionStatus.SUCCESS
        assert response.personal_info.name == "John Doe"
        assert response.personal_info.email == "john.doe@email.com"
        assert response.personal_info.phone is not None
        assert len(response.skills) >= 2
        assert len(response.experience) >= 1
        assert len(response.education) >= 1

    def test_missing_name_returns_partial(self):
        """Missing name but has email returns PARTIAL."""
        entities = [
            NEREntity(
                text="john@email.com",
                label="email",
                score=0.9,
                start=0,
                end=14,
            ),
            NEREntity(
                text="Python",
                label="skills",
                score=0.8,
                start=15,
                end=21,
            ),
        ]

        text_result = TextExtractionResult(text="", method="pdfplumber")

        response = _normalize_output(
            entities=entities,
            text_result=text_result,
            detected_lang=DetectedLanguage.EN,
        )

        assert response.status == ExtractionStatus.PARTIAL
        assert "missing_name" in response.warnings

    def test_empty_entities_not_cv(self):
        """No entities at all returns FAILED with not-a-CV warning."""
        text_result = TextExtractionResult(text="", method="pdfplumber")

        response = _normalize_output(
            entities=[],
            text_result=text_result,
            detected_lang=DetectedLanguage.EN,
        )

        assert response.status == ExtractionStatus.FAILED
        assert any("not_be_a_cv" in w for w in response.warnings)

    def test_low_confidence_warnings(self, mock_ner_entities_low_confidence):
        """Low confidence entities generate warnings."""
        # Mark entities as low_confidence (score < threshold 0.6)
        for entity in mock_ner_entities_low_confidence:
            entity.low_confidence = True

        text_result = TextExtractionResult(text="text", method="pdfplumber")

        response = _normalize_output(
            entities=mock_ner_entities_low_confidence,
            text_result=text_result,
            detected_lang=DetectedLanguage.EN,
        )

        assert any("low_confidence" in w for w in response.warnings)

    def test_email_validation(self):
        """Email entities are validated with regex."""
        entities = [
            NEREntity(
                text="Name: John",
                label="name",
                score=0.9,
                start=0,
                end=10,
            ),
            NEREntity(
                text="not-an-email",
                label="email",
                score=0.7,
                start=11,
                end=23,
            ),
        ]

        text_result = TextExtractionResult(text="text", method="pdfplumber")

        response = _normalize_output(
            entities=entities,
            text_result=text_result,
            detected_lang=DetectedLanguage.EN,
        )

        # Should still store it but add a warning
        assert "email_format_uncertain" in response.warnings

    def test_confidence_scores_calculated(self, mock_ner_entities):
        """Confidence scores are calculated for overall and per-field."""
        text_result = TextExtractionResult(text="text", method="pdfplumber")

        response = _normalize_output(
            entities=mock_ner_entities,
            text_result=text_result,
            detected_lang=DetectedLanguage.EN,
        )

        assert response.confidence_scores.overall > 0
        assert len(response.confidence_scores.per_field) > 0

    def test_skills_deduplicated(self):
        """Duplicate skills are removed."""
        entities = [
            NEREntity(
                text="John",
                label="name",
                score=0.9,
                start=0,
                end=4,
            ),
            NEREntity(
                text="john@email.com",
                label="email",
                score=0.9,
                start=5,
                end=19,
            ),
            NEREntity(
                text="Python",
                label="skills",
                score=0.9,
                start=20,
                end=26,
            ),
            NEREntity(
                text="python",
                label="skills",
                score=0.8,
                start=27,
                end=33,
            ),
            NEREntity(
                text="Java",
                label="skills",
                score=0.85,
                start=34,
                end=38,
            ),
        ]

        text_result = TextExtractionResult(text="text", method="pdfplumber")

        response = _normalize_output(
            entities=entities,
            text_result=text_result,
            detected_lang=DetectedLanguage.EN,
        )

        # Python and python should be deduplicated (case-insensitive)
        python_count = sum(1 for s in response.skills if s.lower() == "python")
        assert python_count == 1


class TestCVPipeline:
    """Test suite for the pipeline orchestrator."""

    @pytest.mark.asyncio
    async def test_invalid_file_returns_failed(self, empty_file_bytes):
        """Invalid file (empty) returns FAILED status immediately."""
        from app.services.cv_pipeline import process_cv

        response = await process_cv(empty_file_bytes, "empty.pdf")
        assert response.status == ExtractionStatus.FAILED
        assert len(response.warnings) > 0

    @pytest.mark.asyncio
    async def test_oversized_file_returns_failed(self, large_file_bytes):
        """Oversized file returns FAILED with size error."""
        from app.services.cv_pipeline import process_cv

        response = await process_cv(large_file_bytes, "huge.pdf")
        assert response.status == ExtractionStatus.FAILED
        assert any("size" in w.lower() for w in response.warnings)

    @pytest.mark.asyncio
    async def test_wrong_format_returns_failed(self, text_file_bytes):
        """Non-CV file returns FAILED."""
        from app.services.cv_pipeline import process_cv

        response = await process_cv(text_file_bytes, "notes.txt")
        assert response.status == ExtractionStatus.FAILED

    @pytest.mark.asyncio
    @patch("app.services.cv_pipeline.ner_extractor")
    @patch("app.services.cv_pipeline.text_extractor")
    @patch("app.services.cv_pipeline.file_validator")
    @patch("app.services.cv_pipeline._try_llm_fallback")
    @patch("app.services.cv_pipeline.settings")
    async def test_pipeline_graceful_on_ner_error(
        self,
        mock_settings,
        mock_llm_fallback,
        mock_validator,
        mock_text,
        mock_ner,
        sample_docx_bytes,
    ):
        """Pipeline handles NER errors gracefully without crashing."""
        from app.services.cv_pipeline import process_cv

        mock_settings.EXTRACTION_STRATEGY = "hybrid"
        mock_settings.MIN_TEXT_LENGTH = 50
        mock_llm_fallback.return_value = None

        # Mock validator: file is valid
        mock_validator.validate_file.return_value = MagicMock(
            is_valid=True,
            warnings=[],
            file_info=MagicMock(mime_type="application/pdf"),
        )

        # Mock text extractor: returns text (must be > 50 chars to pass MIN_TEXT_LENGTH check)
        mock_text.extract_text.return_value = TextExtractionResult(
            text="John Doe john@email.com Python Java experienced software engineer with 5 years of professional experience",
            method="pdfplumber",
        )

        # Mock NER: throws exception
        mock_ner.extract_entities.side_effect = RuntimeError("Model crashed")

        response = await process_cv(sample_docx_bytes, "test.pdf")

        # Should not crash, should return with warnings
        assert response.status in [
            ExtractionStatus.PARTIAL,
            ExtractionStatus.FAILED,
        ]
        assert any(
            "ner_extraction_error" in w for w in response.warnings
        ), f"Warnings were: {response.warnings}"

    @pytest.mark.asyncio
    @patch("app.services.cv_pipeline.ner_extractor")
    @patch("app.services.cv_pipeline.text_extractor")
    @patch("app.services.cv_pipeline.file_validator")
    @patch("app.services.cv_pipeline.settings")
    async def test_extraction_strategy_llm_only(
        self, mock_settings, mock_validator, mock_text, mock_ner, sample_docx_bytes
    ):
        """When strategy is 'llm', NER is completely bypassed."""
        from app.schemas import (
            ConfidenceScores,
            CVExtractionResponse,
            PersonalInfo,
            ProcessingLog,
        )
        from app.services.cv_pipeline import process_cv

        # Force LLM strategy
        mock_settings.EXTRACTION_STRATEGY = "llm"
        mock_settings.MIN_TEXT_LENGTH = 50

        # Mock dependencies
        mock_validator.validate_file.return_value = MagicMock(
            is_valid=True, warnings=[], file_info=MagicMock(mime_type="application/pdf")
        )
        mock_text.extract_text.return_value = TextExtractionResult(
            text="This is a valid text that is definitely longer than fifty characters to bypass the check.",
            method="pdfplumber",
        )

        # We need to patch _try_llm_fallback to return a dummy response
        with patch("app.services.cv_pipeline._try_llm_fallback") as mock_llm:
            dummy_response = CVExtractionResponse(
                status=ExtractionStatus.SUCCESS,
                extraction_method=ExtractionMethod.LLM_FALLBACK,
                language_detected=DetectedLanguage.EN,
                personal_info=PersonalInfo(),
                skills=[],
                experience=[],
                education=[],
                certifications=[],
                confidence_scores=ConfidenceScores(overall=0.0),
                processing_log=ProcessingLog(processing_time_ms=0),
            )
            mock_llm.return_value = dummy_response

            response = await process_cv(sample_docx_bytes, "test.pdf")

            # NER should NOT have been called
            mock_ner.extract_entities.assert_not_called()

            # LLM should have been called
            mock_llm.assert_called_once()
            assert mock_llm.call_args[0][1] == "strategy_llm_only"

            assert response.extraction_method == ExtractionMethod.LLM_FALLBACK

    @pytest.mark.asyncio
    @patch("app.services.cv_pipeline.ner_extractor")
    @patch("app.services.cv_pipeline.text_extractor")
    @patch("app.services.cv_pipeline.file_validator")
    @patch("app.services.cv_pipeline.settings")
    async def test_extraction_strategy_ner_only(
        self,
        mock_settings,
        mock_validator,
        mock_text,
        mock_ner,
        sample_docx_bytes,
        mock_ner_entities,
    ):
        """When strategy is 'ner', LLM fallback is bypassed."""
        from app.services.cv_pipeline import process_cv

        # Force NER strategy
        mock_settings.EXTRACTION_STRATEGY = "ner"
        mock_settings.MIN_TEXT_LENGTH = 50

        # Mock dependencies
        mock_validator.validate_file.return_value = MagicMock(
            is_valid=True, warnings=[], file_info=MagicMock(mime_type="application/pdf")
        )
        mock_text.extract_text.return_value = TextExtractionResult(
            text="This text is definitely long enough to bypass the fifty character minimum length check for NER.",
            method="pdfplumber",
        )

        # Return bad NER entities that would normally trigger fallback
        # Let's just return empty entities so _evaluate_fallback_need would normally return a reason
        mock_ner.extract_entities.return_value = []

        with patch("app.services.cv_pipeline._try_llm_fallback") as mock_llm:
            response = await process_cv(sample_docx_bytes, "test.pdf")

            # NER should have been called
            mock_ner.extract_entities.assert_called_once()

            # LLM should NOT have been called despite bad NER results
            mock_llm.assert_not_called()

            assert response.extraction_method == ExtractionMethod.NER_MODEL
            assert response.status == ExtractionStatus.FAILED
