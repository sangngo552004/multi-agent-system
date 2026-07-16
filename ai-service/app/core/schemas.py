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


# ── Matching Schema ────────────────────────────────────────────────────


class MatchedCriterion(BaseModel):
    skill: str
    evidence: str
    match_score: float


class MissingCriterion(BaseModel):
    skill: str
    criticality: str
    reason: str


class Competency(BaseModel):
    competency_id: str
    name: str
    category: str = Field(
        description="Ví dụ: HARD_SKILL, SOFT_SKILL, EXPERIENCE, PEDIGREE"
    )
    weight: float
    required_level: int = 1
    is_mandatory: bool = False


class JobConfiguration(BaseModel):
    job_id: str
    job_family: str
    career_level: str
    required_competencies: list[Competency] = Field(default_factory=list)
    institutional_rules: list[dict] = Field(default_factory=list)


class CompetencyEvidence(BaseModel):
    competency_id: str
    competency_name: str
    evidence: str = Field(
        description="Trích dẫn chính xác hoặc tóm tắt bằng chứng từ CV chứng minh năng lực này"
    )
    confidence: str = Field(description="HIGH, MEDIUM, hoặc LOW")
    meets_requirement: bool = Field(
        description="Ứng viên có đạt yêu cầu năng lực này không"
    )


# ── Scoring Breakdown (Audit Trail) ───────────────────────────


class CompetencyScoreDetail(BaseModel):
    """Chi tiết điểm của một competency sau khi tính toán."""

    competency_id: str
    competency_name: str
    category: str
    weight: float
    earned_weight: float
    multiplier: float = Field(description="Hệ số confidence: 1.0 / 0.8 / 0.3 / 0.0")
    meets_requirement: bool
    confidence: str
    is_mandatory: bool


class RuleTriggered(BaseModel):
    """Một Institutional Rule đã trigger và đẳ lại tác động."""

    rule_code: str
    rule_name: str
    bonus_added: float = Field(description="Điểm bonus thô cộng vào bonus_score")
    actual_impact: float = Field(
        description="Tác động thực tế vào overall_score (= bonus_added * max_impact / 100)"
    )
    triggered_by: str = Field(
        description="Tên tổ chức trigger rule này, ví dụ: 'ĐH Bách Khoa'"
    )


class ScoringBreakdown(BaseModel):
    """Audit trail đầy đủ các bước tính điểm, lưu vào Application.scoring_breakdown."""

    competency_scores: list[CompetencyScoreDetail] = Field(default_factory=list)
    rules_triggered: list[RuleTriggered] = Field(default_factory=list)
    rejection_reason: Optional[str] = None
    early_knockout: bool = False


class MatchingOutput(BaseModel):
    status: str = "EVALUATED"
    rejection_reason: Optional[str] = None

    evidence_matrix: list[CompetencyEvidence] = Field(default_factory=list)

    overall_score: float = 0.0
    hard_skill_score: float = 0.0
    soft_skill_score: float = 0.0
    experience_score: float = 0.0
    bonus_score: float = 0.0

    is_overqualified: bool = False
    is_high_potential: bool = False
    potential_reason: Optional[str] = None

    matched_criteria: list[MatchedCriterion] = Field(default_factory=list)
    missing_criteria: list[MissingCriterion] = Field(default_factory=list)

    hr_recommendation: str = ""

    # Audit trail — cấu trúc đầy đủ, lưu vào Application.scoring_breakdown
    scoring_breakdown: Optional[ScoringBreakdown] = None


class MatchRequest(BaseModel):
    application_id: str
    cv_data: CVExtractionResponse
    job_data: (
        dict  # Will parse to JobConfiguration if structured, otherwise dict fallback
    )
    job_configuration: Optional[JobConfiguration] = None
    hr_preferences: Optional[str] = None
