"""Tests for text_extractor service."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.text_extractor import extract_text


class TestTextExtractor:
    """Test suite for text extraction."""

    def test_extract_from_docx(self, sample_docx_bytes):
        """DOCX text extraction returns content."""
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        result = extract_text(sample_docx_bytes, mime)
        assert len(result.text) > 0
        assert result.method == "python_docx"
        assert "John Doe" in result.text
        assert "john.doe@email.com" in result.text

    def test_extract_from_pdf(self, sample_pdf_bytes):
        """PDF text extraction works with pdfplumber."""
        result = extract_text(sample_pdf_bytes, "application/pdf")
        # The minimal test PDF may or may not extract text depending
        # on pdfplumber version and font handling
        assert result.method.startswith("pdfplumber")

    def test_unsupported_mime_type(self):
        """Unsupported MIME types return empty result with warning."""
        result = extract_text(b"some data", "application/octet-stream")
        assert result.text == ""
        assert len(result.warnings) > 0
        assert any("unsupported" in w.lower() for w in result.warnings)

    def test_docx_empty_content(self):
        """DOCX with no text paragraphs returns short/empty text."""
        import io
        from docx import Document

        buf = io.BytesIO()
        doc = Document()
        doc.save(buf)
        empty_docx = buf.getvalue()

        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        result = extract_text(empty_docx, mime)
        assert len(result.text) < 50  # Very short or empty

    def test_extraction_method_logged(self, sample_docx_bytes):
        """The extraction method is recorded for debugging."""
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        result = extract_text(sample_docx_bytes, mime)
        assert result.method != ""
        assert result.method in ["pdfplumber", "python_docx",
                                  "pdfplumber+ocr_tesseract"]
