export type UserRole = "ADMIN" | "HR" | "CANDIDATE";
export type UserStatus = "ACTIVE" | "BLOCKED";

export type SystemUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employeeCode?: string;
  departmentName?: string;
  jobTitle?: string;
  workLocation?: string;
  createdAt: string;
  lastActiveAt: string;
  jobsCount: number;
  applicationsCount: number;
  blockReason?: string;
};

export type JobStatus = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT";

export type JobCompetencyRequirement = {
  competencyId: string;
  name: string;
  requiredLevel: number;
  weight: number;
  mandatory: boolean;
};

export type RecruitmentJob = {
  id: string;
  title: string;
  departmentName: string;
  ownerId: string;
  status: JobStatus;
  location: string;
  employmentType: EmploymentType;
  openingsCount: number;
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

export type RecruitmentApplication = {
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
