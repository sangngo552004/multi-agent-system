"""Tests for ner_extractor service."""

from unittest.mock import MagicMock, patch

import pytest

import app.agents.extractor_agent.ner_extractor as ne
from app.agents.extractor_agent.ner_extractor import TransformersNERExtractor
from app.core.schemas import NEREntity


class TestTransformersNERExtractor:
    """Test suite for TransformersNERExtractor."""

    @pytest.fixture
    def extractor(self):
        """Provide a fresh extractor instance for each test."""
        # Ensure the global instance is set to Transformers for module-level functions
        instance = TransformersNERExtractor()
        ne._extractor_instance = instance
        return instance

    def test_model_not_loaded_raises(self, extractor):
        """Calling extract_entities without loading model raises error."""
        with pytest.raises(RuntimeError, match="not loaded"):
            extractor.extract_entities("some text")

    def test_empty_text_returns_empty(self, extractor):
        """Empty text returns no entities."""
        result = extractor.extract_entities("")
        assert result == []

    def test_none_text_returns_empty(self, extractor):
        """None text returns no entities."""
        result = extractor.extract_entities(None)
        assert result == []

    @patch.object(TransformersNERExtractor, "_run_ner")
    def test_short_text_single_pass(self, mock_run_ner, extractor):
        """Short text (under token limit) is processed in single pass."""
        # Setup tokenizer mock
        extractor._tokenizer = MagicMock()
        extractor._tokenizer.encode.return_value = list(range(100))  # 100 tokens
        extractor._ner_pipeline = MagicMock()  # Just to bypass loaded check

        # Mock pipeline results
        mock_run_ner.return_value = [
            {
                "entity_group": "Name",
                "word": "John Doe",
                "score": 0.95,
                "start": 0,
                "end": 8,
            },
            {
                "entity_group": "Email Address",
                "word": "john@email.com",
                "score": 0.98,
                "start": 9,
                "end": 23,
            },
        ]

        result = extractor.extract_entities("John Doe john@email.com")

        assert len(result) == 2
        assert result[0].label == "name"
        assert result[0].text == "John Doe"
        assert result[1].label == "email"

    @patch.object(TransformersNERExtractor, "_run_ner")
    def test_low_confidence_marked(self, mock_run_ner, extractor):
        """Entities with score < threshold are marked low_confidence."""
        extractor._tokenizer = MagicMock()
        extractor._tokenizer.encode.return_value = list(range(50))
        extractor._ner_pipeline = MagicMock()

        mock_run_ner.return_value = [
            {
                "entity_group": "Name",
                "word": "Nguyen",
                "score": 0.35,
                "start": 0,
                "end": 6,
            },
        ]

        result = extractor.extract_entities("Nguyen Van A")

        assert len(result) == 1
        assert result[0].low_confidence is True

    @patch.object(TransformersNERExtractor, "_run_ner")
    def test_duplicate_entities_removed(self, mock_run_ner, extractor):
        """Duplicate entities (same text + label) are deduplicated."""
        extractor._tokenizer = MagicMock()
        extractor._tokenizer.encode.return_value = list(range(50))
        extractor._ner_pipeline = MagicMock()

        mock_run_ner.return_value = [
            {
                "entity_group": "Skills",
                "word": "Python",
                "score": 0.85,
                "start": 0,
                "end": 6,
            },
            {
                "entity_group": "Skills",
                "word": "Python",
                "score": 0.80,
                "start": 50,
                "end": 56,
            },
        ]

        result = extractor.extract_entities("Python ... Python")

        # Should deduplicate
        python_skills = [e for e in result if e.text == "Python"]
        assert len(python_skills) == 1

    def test_is_model_loaded_initially_false(self, extractor):
        """Model is not loaded at import time."""
        assert extractor.is_model_loaded() is False


class TestOverlapResolution:
    """Test overlap resolution logic."""

    def test_overlapping_spans_keep_higher_score(self):
        """When two entities overlap, the higher-scoring one wins."""
        extractor = TransformersNERExtractor()
        entities = [
            NEREntity(
                text="Software Engineer",
                label="title",
                score=0.9,
                start=0,
                end=17,
            ),
            NEREntity(
                text="Software",
                label="skills",
                score=0.5,
                start=0,
                end=8,
            ),
        ]
        result = extractor._resolve_overlaps(entities)
        assert len(result) == 1
        assert result[0].label == "title"

    def test_non_overlapping_spans_kept(self):
        """Non-overlapping entities are all kept."""
        extractor = TransformersNERExtractor()
        entities = [
            NEREntity(text="John", label="name", score=0.9, start=0, end=4),
            NEREntity(
                text="Python",
                label="skills",
                score=0.85,
                start=50,
                end=56,
            ),
        ]
        result = extractor._resolve_overlaps(entities)
        assert len(result) == 2


class TestModuleLevelAPI:
    """Test module-level backwards compatibility functions."""

    @patch.object(TransformersNERExtractor, "is_model_loaded")
    def test_module_is_model_loaded(self, mock_is_loaded):
        ne._extractor_instance = TransformersNERExtractor()
        mock_is_loaded.return_value = True

        assert ne.is_model_loaded() is True
        mock_is_loaded.assert_called_once()
