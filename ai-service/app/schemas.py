"""Pydantic models for request/response schemas."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────────────────────


class ExtractionStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


class ExtractionMethod(str, Enum):
    NER_MODEL = "ner_model"
    LLM_FALLBACK = "llm_fallback"


class DetectedLanguage(str, Enum):
    VI = "vi"
    EN = "en"
    UNKNOWN = "unknown"


# ── Sub-models ─────────────────────────────────────────────────────────


class PersonalInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None


class ExperienceItem(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None


class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None


class ProcessingLog(BaseModel):
    extraction_method: str = ""
    ocr_used: bool = False
    fallback_reason: Optional[str] = None
    processing_time_ms: int = 0
    text_extraction_method: str = ""


class ConfidenceScores(BaseModel):
    overall: float = 0.0
    per_field: dict[str, float] = Field(default_factory=dict)


# ── Main response ─────────────────────────────────────────────────────


class CVExtractionResponse(BaseModel):
    """Standardized output for CV extraction."""

    status: ExtractionStatus = ExtractionStatus.FAILED
    extraction_method: ExtractionMethod = ExtractionMethod.NER_MODEL
    language_detected: DetectedLanguage = DetectedLanguage.UNKNOWN
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo)
    skills: list[str] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    confidence_scores: ConfidenceScores = Field(default_factory=ConfidenceScores)
    warnings: list[str] = Field(default_factory=list)
    processing_log: ProcessingLog = Field(default_factory=ProcessingLog)


# ── Validation result ──────────────────────────────────────────────────


class FileInfo(BaseModel):
    mime_type: str = ""
    file_size_bytes: int = 0
    page_count: Optional[int] = None
    filename: str = ""


class ValidationResult(BaseModel):
    is_valid: bool = True
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    file_info: FileInfo = Field(default_factory=FileInfo)


# ── NER entity ─────────────────────────────────────────────────────────


class NEREntity(BaseModel):
    text: str
    label: str
    score: float
    start: int
    end: int
    low_confidence: bool = False


# ── Text extraction result ─────────────────────────────────────────────


class TextExtractionResult(BaseModel):
    text: str = ""
    method: str = ""  # "pdfplumber", "ocr_tesseract", "python_docx"
    ocr_used: bool = False
    page_texts: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


# ── RabbitMQ message models ────────────────────────────────────────────


class CVExtractRequest(BaseModel):
    application_id: str
    file_url: str
    callback_queue: str = "cv.extract.response"


class CVExtractResult(BaseModel):
    application_id: str
    result: CVExtractionResponse
    error: Optional[str] = None
