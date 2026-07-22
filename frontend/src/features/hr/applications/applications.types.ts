import type { ApplicationStatusHistoryEntry, CareerPathGenerationStatus, HrApplicationNote } from "@/types/domain/hr";
import type { AiProcessingStatus, JobCompetencyRequirement, RecruitmentApplication, RecruitmentStatus } from "@/types/domain/recruitment";

export type HrApplicationDateRange = "ALL" | "7" | "30";
export type HrApplicationSort = "SUBMITTED_DESC" | "UPDATED_DESC" | "SCORE_DESC";

export type HrApplicationFilters = {
  search?: string;
  jobId?: string | "ALL";
  recruitmentStatus?: RecruitmentStatus | "ALL";
  aiStatus?: AiProcessingStatus | "ALL";
  dateRange?: HrApplicationDateRange;
  review?: "ALL" | "REQUIRED";
  sort?: HrApplicationSort;
};

export type HrApplicationListItem = Pick<RecruitmentApplication,
  "id" | "candidateId" | "jobId" | "recruitmentStatus" | "aiStatus" | "submittedAt" | "matchScore" | "aiConfidence" | "needsReview" | "extractionWarnings"
> & {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  departmentName: string;
  updatedAt: string;
};

export type CompetencyEvidence = JobCompetencyRequirement & {
  evidence: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidenceStatus: "SUPPORTED" | "PARTIAL" | "NOT_FOUND";
};

export type HrApplicationDetail = RecruitmentApplication & {
  candidateName: string;
  candidateEmail: string;
  candidateEmployeeCode?: string;
  jobTitle: string;
  departmentName: string;
  jobLocation: string;
  competencyEvidence: CompetencyEvidence[];
  histories: ApplicationStatusHistoryEntry[];
  notes: HrApplicationNote[];
  careerPathStatus: CareerPathGenerationStatus;
  talentPoolConsent: boolean;
  talentPoolEntryId?: string;
};

export type UpdateHrApplicationStatusInput = {
  applicationId: string;
  status: RecruitmentStatus;
  reason?: string;
};

export type AddHrApplicationNoteInput = {
  applicationId: string;
  content: string;
};
