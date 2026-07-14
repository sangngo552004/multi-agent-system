"""File validation service.

Validates uploaded CV files before processing:
- MIME type verification (magic number, not just extension)
- File size limits
- Page count limits
- Corrupt/empty/password-protected file detection
"""

import io
import logging

import magic
import pdfplumber
from docx import Document as DocxDocument
from docx.opc.exceptions import PackageNotFoundError

from app.core.config import settings
from app.core.schemas import ValidationResult

logger = logging.getLogger(__name__)

# MIME types we accept
ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

# Fallback detection for MIME types that python-magic might report differently
PDF_MAGIC_BYTES = b"%PDF"
DOCX_MAGIC_BYTES = b"PK\x03\x04"  # ZIP signature (DOCX is a ZIP archive)


def validate_file(
    file_content: bytes,
    filename: str,
) -> ValidationResult:
    """Validate an uploaded CV file.

    Args:
        file_content: Raw bytes of the uploaded file.
        filename: Original filename (used for logging only, not trusted).

    Returns:
        ValidationResult with is_valid flag, errors, warnings, and file_info.
    """
    result = ValidationResult()
    result.file_info.filename = filename
    result.file_info.file_size_bytes = len(file_content)

    # ── 1. Empty file check ───────────────────────────────────────────
    if len(file_content) == 0:
        result.is_valid = False
        result.errors.append("File is empty (0 bytes).")
        logger.warning("Rejected empty file: %s", filename)
        return result

    # ── 2. File size check ────────────────────────────────────────────
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_content) > max_bytes:
        result.is_valid = False
        result.errors.append(
            f"File size ({len(file_content) / 1024 / 1024:.1f}MB) "
            f"exceeds maximum allowed size ({settings.MAX_FILE_SIZE_MB}MB)."
        )
        logger.warning(
            "Rejected oversized file: %s (%.1fMB)",
            filename,
            len(file_content) / 1024 / 1024,
        )
        return result

    # ── 3. MIME type detection (magic number) ─────────────────────────
    detected_mime = _detect_mime_type(file_content)
    result.file_info.mime_type = detected_mime

    if detected_mime not in ALLOWED_MIME_TYPES:
        result.is_valid = False
        result.errors.append(
            f"Unsupported file type: '{detected_mime}'. "
            f"Only PDF and DOCX files are accepted. "
            f"(File extension '{filename}' is not used for validation.)"
        )
        logger.warning(
            "Rejected file with unsupported MIME type: %s "
            "(detected: %s, filename: %s)",
            detected_mime,
            detected_mime,
            filename,
        )
        return result

    file_type = ALLOWED_MIME_TYPES[detected_mime]

    # ── 4. Format-specific validation ─────────────────────────────────
    if file_type == "pdf":
        _validate_pdf(file_content, result)
    elif file_type == "docx":
        _validate_docx(file_content, result)

    return result


def _detect_mime_type(file_content: bytes) -> str:
    """Detect MIME type using magic numbers, not file extension."""
    try:
        mime = magic.from_buffer(file_content, mime=True)

        # python-magic on Windows often returns generic types for DOCX
        # (application/octet-stream or application/zip). Fall through to
        # manual detection in those cases.
        if mime not in ("application/octet-stream", "application/zip"):
            return mime
    except Exception:
        pass

    # Fallback to manual magic byte detection
    if file_content[:4] == PDF_MAGIC_BYTES:
        return "application/pdf"
    if file_content[:4] == DOCX_MAGIC_BYTES:
        # ZIP-based format; verify it's actually a DOCX by checking
        # for the [Content_Types].xml entry
        if b"word/" in file_content[:2000]:
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return "application/octet-stream"


def _validate_pdf(file_content: bytes, result: ValidationResult) -> None:
    """Validate PDF-specific constraints."""
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            page_count = len(pdf.pages)
            result.file_info.page_count = page_count

            # Check page count
            if page_count > settings.MAX_PAGE_COUNT:
                result.is_valid = False
                result.errors.append(
                    f"PDF has {page_count} pages, exceeding the "
                    f"maximum of {settings.MAX_PAGE_COUNT} pages. "
                    f"This does not appear to be a CV."
                )
                return

            if page_count > settings.WARN_PAGE_COUNT:
                result.warnings.append(
                    f"PDF has {page_count} pages. " f"CVs are typically 1-3 pages."
                )

            if page_count == 0:
                result.is_valid = False
                result.errors.append("PDF has no pages.")
                return

    except Exception as e:
        error_msg = str(e).lower()
        if "password" in error_msg or "encrypted" in error_msg:
            result.is_valid = False
            result.errors.append(
                "PDF is password-protected. " "Please upload an unprotected file."
            )
        else:
            result.is_valid = False
            result.errors.append(f"PDF file is corrupt or cannot be opened: {str(e)}")
        logger.error("PDF validation failed for %s: %s", result.file_info.filename, e)


def _validate_docx(file_content: bytes, result: ValidationResult) -> None:
    """Validate DOCX-specific constraints."""
    try:
        doc = DocxDocument(io.BytesIO(file_content))
        # Estimate page count from paragraph count (rough heuristic)
        para_count = len(doc.paragraphs)
        if para_count == 0:
            result.warnings.append("DOCX file appears to have no text paragraphs.")
        # DOCX doesn't have a reliable page count without rendering;
        # we set it to None
        result.file_info.page_count = None
    except PackageNotFoundError:
        result.is_valid = False
        result.errors.append("DOCX file is corrupt or not a valid Word document.")
        logger.error(
            "DOCX validation failed for %s: PackageNotFoundError",
            result.file_info.filename,
        )
    except Exception as e:
        error_msg = str(e).lower()
        if "password" in error_msg or "encrypted" in error_msg:
            result.is_valid = False
            result.errors.append(
                "DOCX is password-protected. " "Please upload an unprotected file."
            )
        else:
            result.is_valid = False
            result.errors.append(f"DOCX file is corrupt or cannot be opened: {str(e)}")
        logger.error(
            "DOCX validation failed for %s: %s",
            result.file_info.filename,
            e,
        )
