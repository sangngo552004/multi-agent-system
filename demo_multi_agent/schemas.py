from dataclasses import dataclass, field


@dataclass
class CandidateProfile:
    name: str = ""
    years_experience: int = 0
    skills: list[str] = field(default_factory=list)
    education: str = ""
    highlights: list[str] = field(default_factory=list)


@dataclass
class JobRequirement:
    title: str
    required_skills: list[str]
    preferred_skills: list[str]
    min_years_experience: int


@dataclass
class MatchResult:
    matched_skills: list[str] = field(default_factory=list)
    missing_skills: list[str] = field(default_factory=list)
    score: float = 0.0
    decision: str = "REVIEW"
    reasons: list[str] = field(default_factory=list)


@dataclass
class WorkflowState:
    raw_cv_text: str
    job: JobRequirement
    candidate: CandidateProfile | None = None
    match_result: MatchResult | None = None
    learning_path: list[str] = field(default_factory=list)
    approved_by_human: bool = False
