import type { AdminJob, AdminUser, JobStatus } from "@/types/domain/admin";

export type JobFilters = {
  search?: string;
  status?: JobStatus | "ALL";
  jobFamilyId?: string | "ALL";
  careerLevelId?: string | "ALL";
  readiness?: "ALL" | "READY" | "INCOMPLETE";
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
  owner: Pick<AdminUser, "id" | "fullName" | "email" | "departmentName" | "employeeCode" | "jobTitle">;
  aiCompletedCount: number;
  aiFailedCount: number;
  readinessIssues: string[];
};
