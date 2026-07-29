import type { AdminJob, AdminUser, JobStatus } from "@/types/domain/admin";

export type JobFilters = {
  search?: string;
  status?: JobStatus | "ALL";
  jobFamilyId?: string | "ALL";
  careerLevelId?: string | "ALL";
  readiness?: "ALL" | "READY" | "INCOMPLETE";
  page?: number;
  size?: number;
  sort?: string;
};

export type JobListItem = AdminJob & {
  ownerName: string;
  applicationCount: number;
  matchingReady: boolean;
};

export type JobListResult = {
  items: JobListItem[];
  statusCounts: Record<JobStatus, number>;
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type JobFilterOptions = {
  jobFamilies: Array<{ id: string; name: string; status: "ACTIVE" | "INACTIVE" }>;
  careerLevels: Array<{
    id: string;
    name: string;
    rankValue: number;
    status: "ACTIVE" | "INACTIVE";
  }>;
};

export type JobDetail = JobListItem & {
  owner: Pick<AdminUser, "id" | "fullName" | "email" | "departmentName" | "employeeCode" | "jobTitle">;
  aiCompletedCount: number;
  aiFailedCount: number;
  readinessIssues: string[];
};
