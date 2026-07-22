import type {
  AiProcessingStatus,
  JobStatus,
  RecruitmentJob,
  RecruitmentStatus,
} from "@/types/domain/recruitment";
import type { HrJobFormValues } from "@/features/hr/jobs/jobs.schema";

export type HrDeadlineFilter = "ALL" | "EXPIRING" | "EXPIRED";

export type HrJobFilters = {
  search?: string;
  status?: JobStatus | "ALL";
  jobFamilyId?: string | "ALL";
  careerLevelId?: string | "ALL";
  readiness?: "ALL" | "READY" | "INCOMPLETE";
  deadline?: HrDeadlineFilter;
};

export type HrJobListItem = RecruitmentJob & {
  applicationCount: number;
  newApplicationCount: number;
  matchingReady: boolean;
  expiresSoon: boolean;
  expired: boolean;
};

export type HrJobListResult = {
  items: HrJobListItem[];
  statusCounts: Record<JobStatus, number>;
};

export type HrRecentApplication = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  recruitmentStatus: RecruitmentStatus;
  aiStatus: AiProcessingStatus;
  matchScore?: number;
  submittedAt: string;
};

export type HrJobDetail = HrJobListItem & {
  readinessIssues: string[];
  pipelineCounts: Record<RecruitmentStatus, number>;
  aiCompletedCount: number;
  aiFailedCount: number;
  recentApplications: HrRecentApplication[];
};

export type HrCatalogOptions = {
  jobFamilies: Array<{ id: string; name: string }>;
  careerLevels: Array<{ id: string; name: string }>;
  competencies: Array<{ id: string; name: string; category: string }>;
};

export type SaveHrJobInput = {
  jobId?: string;
  values: HrJobFormValues;
  publish: boolean;
};

export type ChangeHrJobStatusInput = {
  jobId: string;
  status: JobStatus;
};
