"""Pydantic models for request/response schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

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


# -- Career path -------------------------------------------------------------


class CareerPathStatus(str, Enum):
    GENERATED = "GENERATED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    INSUFFICIENT_INPUT = "INSUFFICIENT_INPUT"
    NEEDS_HUMAN_REVIEW = "NEEDS_HUMAN_REVIEW"
    FAILED = "FAILED"


class DeliveryStatus(str, Enum):
    BLOCKED = "BLOCKED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    ELIGIBLE = "ELIGIBLE"


class DecisionOutcome(str, Enum):
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    PENDING_REVIEW = "PENDING_REVIEW"


class DecisionSource(str, Enum):
    HR = "HR"
    AUTO_POLICY = "AUTO_POLICY"


class GapAssessment(str, Enum):
    MET = "MET"
    PARTIAL = "PARTIAL"
    NOT_EVIDENCED = "NOT_EVIDENCED"
    UNKNOWN = "UNKNOWN"


class GapPriority(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"


class GapActionMode(str, Enum):
    LEARN = "LEARN"
    PRACTICE = "PRACTICE"
    ASSESS_FIRST = "ASSESS_FIRST"
    BUILD_EVIDENCE = "BUILD_EVIDENCE"


class DataQualityGrade(str, Enum):
    SUFFICIENT = "SUFFICIENT"
    LIMITED = "LIMITED"
    INSUFFICIENT = "INSUFFICIENT"


class EvidenceSource(str, Enum):
    MATCHER_EVIDENCE = "MATCHER_EVIDENCE"
    VECTOR_MATCH = "VECTOR_MATCH"
    CV_FIELD = "CV_FIELD"


class _StrictCareerPathInput(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DecisionSnapshot(_StrictCareerPathInput):
    decision_id: str = Field(min_length=1)
    outcome: DecisionOutcome
    is_final: bool
    source: DecisionSource
    reason_codes: list[str] = Field(default_factory=list)
    related_competency_ids: list[str] = Field(default_factory=list)
    approved_rationale: Optional[str] = None
    policy_version: str = Field(min_length=1)
    decided_at: datetime


class CareerPathCandidateSnapshot(_StrictCareerPathInput):
    status: ExtractionStatus
    extraction_method: ExtractionMethod
    language_detected: DetectedLanguage
    skills: list[str] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    confidence_scores: ConfidenceScores = Field(default_factory=ConfidenceScores)
    warnings: list[str] = Field(default_factory=list)
    snapshot_version: str = "1.0"


class CareerPathMatchingSnapshot(_StrictCareerPathInput):
    status: str = "EVALUATED"
    evidence_matrix: list[CompetencyEvidence] = Field(default_factory=list)
    matched_criteria: list[MatchedCriterion] = Field(default_factory=list)
    missing_criteria: list[MissingCriterion] = Field(default_factory=list)
    snapshot_version: str = "1.0"


class CareerPathCompetencyTarget(_StrictCareerPathInput):
    competency_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    weight: float = Field(ge=0)
    required_level: int = Field(ge=1)
    required_level_description: Optional[str] = None
    is_mandatory: bool = False
    data_version: str = "1.0"


class CareerPathJobSnapshot(_StrictCareerPathInput):
    job_id: str = Field(min_length=1)
    job_family: str = Field(min_length=1)
    career_level: str = Field(min_length=1)
    title: Optional[str] = None
    required_competencies: list[CareerPathCompetencyTarget] = Field(
        default_factory=list
    )
    snapshot_version: str = "1.0"

    @model_validator(mode="after")
    def validate_unique_competencies(self):
        ids = [item.competency_id for item in self.required_competencies]
        if len(ids) != len(set(ids)):
            raise ValueError("job competency IDs must be unique")
        return self


class CandidateConstraints(_StrictCareerPathInput):
    hours_per_week: Optional[int] = Field(default=None, ge=1, le=40)
    max_duration_weeks: Optional[int] = Field(default=None, ge=1, le=104)
    preferred_language: Literal["vi", "en"] = "vi"
    max_budget: Optional[Literal["FREE", "LOW", "MEDIUM", "HIGH"]] = None
    preferred_formats: list[str] = Field(default_factory=list)


class PlanningPolicy(_StrictCareerPathInput):
    version: str = Field(min_length=1)
    applicable_reason_codes: list[str] = Field(default_factory=list)
    default_hours_per_week: int = Field(default=6, ge=1, le=40)
    default_duration_weeks: int = Field(default=12, ge=1, le=104)
    max_duration_weeks: int = Field(default=24, ge=1, le=104)
    max_phases: int = Field(default=4, ge=1, le=12)
    core_gap_count: int = Field(default=3, ge=1, le=20)
    allow_candidate_auto_delivery: bool = False
    resource_max_age_days: int = Field(default=180, ge=1)

    @model_validator(mode="after")
    def validate_duration_bounds(self):
        if self.default_duration_weeks > self.max_duration_weeks:
            raise ValueError("default duration cannot exceed maximum duration")
        return self


class ApprovedLearningResource(_StrictCareerPathInput):
    resource_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    competency_ids: list[str] = Field(min_length=1)
    min_level: int = Field(default=1, ge=1)
    max_level: int = Field(default=5, ge=1)
    language: Literal["vi", "en"]
    format: str = Field(min_length=1)
    cost_tier: Literal["FREE", "LOW", "MEDIUM", "HIGH"] = "FREE"
    estimated_hours: int = Field(default=1, ge=1)
    url: str = Field(min_length=1)
    last_verified_at: datetime
    catalog_version: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_level_bounds(self):
        if self.min_level > self.max_level:
            raise ValueError("resource minimum level cannot exceed maximum level")
        return self


class CareerPathRequest(_StrictCareerPathInput):
    application_id: str = Field(min_length=1)
    decision: DecisionSnapshot
    candidate: CareerPathCandidateSnapshot
    matching: CareerPathMatchingSnapshot
    job: CareerPathJobSnapshot
    constraints: CandidateConstraints = Field(default_factory=CandidateConstraints)
    policy: PlanningPolicy
    approved_resources: list[ApprovedLearningResource] = Field(default_factory=list)
    request_version: str = "1.0"

    @model_validator(mode="after")
    def validate_references(self):
        competency_ids = {
            item.competency_id for item in self.job.required_competencies
        }
        unknown_decision_ids = set(
            self.decision.related_competency_ids
        ) - competency_ids
        if unknown_decision_ids:
            raise ValueError("decision references unknown job competencies")
        resource_ids = [item.resource_id for item in self.approved_resources]
        if len(resource_ids) != len(set(resource_ids)):
            raise ValueError("approved resource IDs must be unique")
        unknown_resource_competencies = {
            competency_id
            for resource in self.approved_resources
            for competency_id in resource.competency_ids
            if competency_id not in competency_ids
        }
        if unknown_resource_competencies:
            raise ValueError("resource references unknown job competencies")
        return self


class EvidenceReference(BaseModel):
    source: EvidenceSource
    path: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    confidence: Optional[str] = None


class CompetencyGap(BaseModel):
    gap_id: str = Field(min_length=1)
    competency_id: str = Field(min_length=1)
    competency_name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    target_level: int = Field(ge=1)
    target_level_description: Optional[str] = None
    assessment: GapAssessment
    observed_level: Optional[int] = Field(default=None, ge=1)
    priority: Optional[GapPriority] = None
    action_mode: Optional[GapActionMode] = None
    is_mandatory: bool = False
    weight: float = Field(ge=0)
    criticality: Optional[str] = None
    reason_codes: list[str] = Field(default_factory=list)
    evidence_references: list[EvidenceReference] = Field(default_factory=list)
    rationale: str = Field(min_length=1)
    requires_human_review: bool = False


class GapAnalysisResult(BaseModel):
    is_applicable: bool
    applicability_reason: Optional[str] = None
    all_gaps: list[CompetencyGap] = Field(default_factory=list)
    roadmap_gaps: list[CompetencyGap] = Field(default_factory=list)
    strengths: list[CompetencyGap] = Field(default_factory=list)
    data_quality: DataQualityGrade
    limitations: list[str] = Field(default_factory=list)
    requires_human_review: bool = False


class RoadmapActivity(_StrictCareerPathInput):
    activity_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    week_start: int = Field(ge=1)
    week_end: int = Field(ge=1)
    estimated_hours: int = Field(ge=1)


class RoadmapDeliverable(_StrictCareerPathInput):
    deliverable_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)


class RoadmapAssessment(_StrictCareerPathInput):
    method: str = Field(min_length=1)
    acceptance_criteria: list[str] = Field(min_length=1)


class RoadmapPhase(_StrictCareerPathInput):
    phase_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    duration_weeks: int = Field(ge=1)
    addressed_gap_ids: list[str] = Field(min_length=1)
    prerequisite_phase_ids: list[str] = Field(default_factory=list)
    activities: list[RoadmapActivity] = Field(min_length=1)
    deliverables: list[RoadmapDeliverable] = Field(min_length=1)
    assessment: RoadmapAssessment
    resource_ids: list[str] = Field(default_factory=list)


class CareerPathDraft(_StrictCareerPathInput):
    candidate_message: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    total_duration_weeks: int = Field(ge=1)
    hours_per_week: int = Field(ge=1)
    phases: list[RoadmapPhase] = Field(min_length=1)
    checkpoints: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    draft_version: str = "1.1"


class RoadmapValidationMetrics(BaseModel):
    critical_gap_count: int = 0
    covered_critical_gap_count: int = 0
    phase_count: int = 0
    total_duration_weeks: int = 0


class RoadmapValidationResult(BaseModel):
    is_valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    metrics: RoadmapValidationMetrics = Field(
        default_factory=RoadmapValidationMetrics
    )


class CandidateLearningResource(BaseModel):
    title: str
    provider: str
    url: str
    format: str
    language: Literal["vi", "en"]


class CandidateRoadmapActivity(BaseModel):
    title: str
    description: str
    week_start: int = Field(ge=1)
    week_end: int = Field(ge=1)
    estimated_hours: int = Field(ge=1)


class CandidateRoadmapDeliverable(BaseModel):
    title: str
    description: str


class CandidateRoadmapAssessment(BaseModel):
    method: str
    acceptance_criteria: list[str] = Field(default_factory=list)


class CandidateRoadmapPhase(BaseModel):
    title: str
    week_start: int = Field(ge=1)
    week_end: int = Field(ge=1)
    duration_weeks: int = Field(ge=1)
    estimated_hours: int = Field(ge=1)
    activities: list[CandidateRoadmapActivity] = Field(default_factory=list)
    deliverables: list[CandidateRoadmapDeliverable] = Field(default_factory=list)
    assessment: CandidateRoadmapAssessment
    resources: list[CandidateLearningResource] = Field(default_factory=list)


class CandidateCareerPathView(BaseModel):
    message: str
    target_role: str
    summary: str
    total_duration_weeks: int = Field(ge=1)
    hours_per_week: int = Field(ge=1)
    total_estimated_hours: int = Field(ge=1)
    demonstrated_strengths: list[str] = Field(default_factory=list)
    priority_growth_areas: list[str] = Field(default_factory=list)
    phases: list[CandidateRoadmapPhase] = Field(default_factory=list)
    checkpoints: list[str] = Field(default_factory=list)
    resources: list[CandidateLearningResource] = Field(default_factory=list)
    next_action: str
    limitations: list[str] = Field(default_factory=list)
    language: Literal["vi", "en"] = "vi"


class CareerPathDiagnostics(BaseModel):
    validation_errors: list[str] = Field(default_factory=list)
    validation_warnings: list[str] = Field(default_factory=list)
    data_quality: DataQualityGrade = DataQualityGrade.INSUFFICIENT
    limitations: list[str] = Field(default_factory=list)
    llm_used: bool = False
    fallback_reason: Optional[str] = None
    requires_human_review: bool = True
    retry_count: int = Field(default=0, ge=0)
    processing_time_ms: int = Field(default=0, ge=0)


class CareerPathProvenance(BaseModel):
    agent_version: str
    policy_version: str
    decision_id: str
    job_snapshot_version: str
    candidate_snapshot_version: str
    matching_snapshot_version: str
    schema_version: str = "1.1"
    prompt_version: Optional[str] = None
    model_name: Optional[str] = None
    resource_catalog_versions: list[str] = Field(default_factory=list)


class CareerPathOutput(BaseModel):
    status: CareerPathStatus
    delivery_status: DeliveryStatus
    application_id: Optional[str] = None
    decision_id: Optional[str] = None
    target_job: Optional[CareerPathJobSnapshot] = None
    gaps: list[CompetencyGap] = Field(default_factory=list)
    internal_draft: Optional[CareerPathDraft] = None
    candidate_view: Optional[CandidateCareerPathView] = None
    diagnostics: CareerPathDiagnostics
    provenance: CareerPathProvenance


class ApiErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    error_code: str = Field(min_length=1)
    message: str = Field(min_length=1)
