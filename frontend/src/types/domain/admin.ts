export type UserRole = "ADMIN" | "HR" | "CANDIDATE";
export type UserStatus = "ACTIVE" | "BLOCKED";
export type HrVerificationStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "VERIFIED"
  | "CHANGES_REQUESTED"
  | "REJECTED";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  verificationStatus: HrVerificationStatus;
  companyName?: string;
  companyEmail?: string;
  companyWebsite?: string;
  verificationNote?: string;
  createdAt: string;
  lastActiveAt: string;
  jobsCount: number;
  applicationsCount: number;
  blockReason?: string;
};

export type JobStatus = "PENDING" | "PUBLISHED" | "HIDDEN" | "CLOSED";
export type JobModerationState = "AWAITING" | "APPROVED" | "REJECTED";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT";

export type JobCompetencyRequirement = {
  competencyId: string;
  name: string;
  requiredLevel: number;
  weight: number;
  mandatory: boolean;
};

export type AdminJob = {
  id: string;
  title: string;
  companyName: string;
  ownerId: string;
  status: JobStatus;
  moderationState: JobModerationState;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requirements: string[];
  benefits: string[];
  jobFamilyId?: string;
  jobFamilyName?: string;
  careerLevelId?: string;
  careerLevelName?: string;
  competencies: JobCompetencyRequirement[];
  createdAt: string;
  expiresAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
};

export type AiProcessingStatus = "WAITING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type RecruitmentStatus = "PENDING" | "REVIEWING" | "SHORTLISTED" | "REJECTED" | "HIRED";
export type AiErrorCode = "AI_TIMEOUT" | "INVALID_FILE";

export type CandidateExperience = {
  company: string;
  role: string;
  period: string;
  summary: string;
};

export type CandidateEducation = {
  school: string;
  program: string;
  period: string;
};

export type CareerPathPhase = {
  title: string;
  duration: string;
  objective: string;
  activities: string[];
};

export type AdminApplication = {
  id: string;
  candidateId: string;
  jobId: string;
  recruitmentStatus: RecruitmentStatus;
  aiStatus: AiProcessingStatus;
  submittedAt: string;
  matchScore?: number;
  aiConfidence: number;
  needsReview: boolean;
  extractionMethod: "TEXT_LAYER" | "OCR";
  errorCode?: AiErrorCode;
  errorMessage?: string;
  canRetry: boolean;
  personalSummary: string;
  skillGroups: Array<{ group: string; skills: string[] }>;
  experiences: CandidateExperience[];
  education: CandidateEducation[];
  languages: string[];
  extractionWarnings: string[];
  scoreBreakdown?: {
    hardSkills: number;
    softSkills: number;
    experience: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  aiRecommendation?: string;
  growthAreas: string[];
  careerPath: CareerPathPhase[];
};

export type ActivityKind =
  | "USER_STATUS_CHANGED"
  | "HR_VERIFICATION_CHANGED"
  | "JOB_STATUS_CHANGED"
  | "JOB_MODERATION_CHANGED"
  | "AI_RETRY_COMPLETED"
  | "KNOWLEDGE_CHANGED"
  | "JOB_SUBMITTED"
  | "AI_PROCESSING_FAILED"
  | "APPLICATION_SUBMITTED";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  actorName: string;
  description: string;
  targetLabel: string;
  targetHref?: string;
  createdAt: string;
};

export type KnowledgeItemStatus = "ACTIVE" | "INACTIVE";

export type JobFamily = {
  id: string;
  name: string;
  description: string;
  status: KnowledgeItemStatus;
};

export type CareerLevel = {
  id: string;
  name: string;
  description: string;
  rankValue: number;
  status: KnowledgeItemStatus;
};

export type CompetencyLevel = {
  level: number;
  title: string;
  description: string;
};

export type Competency = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: KnowledgeItemStatus;
  levels: CompetencyLevel[];
};
