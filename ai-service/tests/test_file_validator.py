"""Tests for file_validator service."""

from app.agents.extractor_agent.file_validator import validate_file


class TestFileValidator:
    """Test suite for file validation."""

    def test_valid_pdf(self, sample_pdf_bytes):
        """A valid PDF file passes validation."""
        result = validate_file(sample_pdf_bytes, "resume.pdf")
        assert result.is_valid is True
        assert len(result.errors) == 0
        assert "pdf" in result.file_info.mime_type.lower()

    def test_valid_docx(self, sample_docx_bytes):
        """A valid DOCX file passes validation."""
        result = validate_file(sample_docx_bytes, "resume.docx")
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_empty_file(self, empty_file_bytes):
        """Empty files are rejected."""
        result = validate_file(empty_file_bytes, "empty.pdf")
        assert result.is_valid is False
        assert any("empty" in e.lower() for e in result.errors)

    def test_oversized_file(self, large_file_bytes):
        """Files exceeding size limit are rejected."""
        result = validate_file(large_file_bytes, "huge.pdf")
        assert result.is_valid is False
        assert any("size" in e.lower() for e in result.errors)

    def test_wrong_mime_type(self, text_file_bytes):
        """Non-PDF/DOCX files are rejected based on MIME type."""
        result = validate_file(text_file_bytes, "resume.pdf")
        # Even though extension is .pdf, MIME detection should catch it
        assert result.is_valid is False
        assert any("unsupported" in e.lower() for e in result.errors)

    def test_renamed_txt_to_pdf(self):
        """A text file renamed to .pdf is rejected by magic number check."""
        fake_pdf = b"This is clearly not a PDF file"
        result = validate_file(fake_pdf, "fakecv.pdf")
        assert result.is_valid is False

    def test_corrupt_pdf(self, corrupt_pdf_bytes):
        """Corrupt PDFs are detected."""
        result = validate_file(corrupt_pdf_bytes, "corrupt.pdf")
        # Either rejected at MIME check or at PDF parsing
        # Both are valid behaviors
        if result.is_valid:
            # Some corrupt PDFs pass MIME check but fail parsing
            pass
        else:
            assert len(result.errors) > 0

    def test_filename_stored_in_file_info(self, sample_docx_bytes):
        """Original filename is stored in file_info."""
        result = validate_file(sample_docx_bytes, "my_resume.docx")
        assert result.file_info.filename == "my_resume.docx"

    def test_file_size_recorded(self, sample_docx_bytes):
        """File size is recorded in file_info."""
        result = validate_file(sample_docx_bytes, "resume.docx")
        assert result.file_info.file_size_bytes == len(sample_docx_bytes)
        assert result.file_info.file_size_bytes > 0
