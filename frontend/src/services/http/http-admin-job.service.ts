"use client";

import type {
  JobDetail,
  JobFilterOptions,
  JobFilters,
  JobListResult,
} from "@/features/admin/jobs/jobs.types";
import { apiRequest } from "@/services/http/api-client";
import { adminQueryString } from "@/services/http/http-admin.shared";

type JobDetailEnvelope = {
  job: Omit<
    JobDetail,
    "owner" | "aiCompletedCount" | "aiFailedCount" | "readinessIssues"
  >;
  owner: JobDetail["owner"];
  aiCompletedCount: number;
  aiFailedCount: number;
  readinessIssues: string[];
};

export const httpAdminJobService = {
  getJobFilterOptions() {
    return apiRequest<JobFilterOptions>("/api/v1/admin/jobs/filter-options");
  },

  getJobs(filters: JobFilters = {}) {
    return apiRequest<JobListResult>(
      `/api/v1/admin/jobs${adminQueryString(filters)}`,
    );
  },

  async getJob(jobId: string) {
    const result = await apiRequest<JobDetailEnvelope>(
      `/api/v1/admin/jobs/${jobId}`,
    );
    return {
      ...result.job,
      owner: result.owner,
      aiCompletedCount: result.aiCompletedCount,
      aiFailedCount: result.aiFailedCount,
      readinessIssues: result.readinessIssues,
    } satisfies JobDetail;
  },
};
