import type { AdminJob, AdminUser, JobModerationState, JobStatus } from "@/types/domain/admin";

export type JobFilters = {
  search?: string;
  status?: JobStatus | "ALL";
  jobFamilyId?: string | "ALL";
  careerLevelId?: string | "ALL";
  moderationState?: JobModerationState | "ALL";
};

export type JobListItem = AdminJob & {
  ownerName: string;
  applicationCount: number;
  matchingReady: boolean;
};

export type JobListResult = {
  items: JobListItem[];
  statusCounts: Record<JobStatus, number>;
};

export type JobDetail = JobListItem & {
  owner: Pick<AdminUser, "id" | "fullName" | "email" | "verificationStatus">;
  aiCompletedCount: number;
  aiFailedCount: number;
  averageMatchScore?: number;
  readinessIssues: string[];
};

export type JobAction = "APPROVE" | "REJECT" | "HIDE" | "REPUBLISH";

export type JobActionInput = {
  jobId: string;
  action: JobAction;
  reason?: string;
};
