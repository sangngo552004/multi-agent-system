"use client";

import type {
  AiRetryAccepted,
  ApplicationDetail,
  ApplicationFilters,
  ApplicationListResult,
} from "@/features/admin/applications/applications.types";
import type {
  ActivityFilters,
  ActivityListResult,
} from "@/features/admin/activity/activity.types";
import type {
  JobDetail,
  JobFilterOptions,
  JobFilters,
  JobListResult,
} from "@/features/admin/jobs/jobs.types";
import type {
  CareerLevelInput,
  CareerLevelView,
  CompetencyInput,
  CompetencyView,
  JobFamilyInput,
  JobFamilyView,
  KnowledgeOverview,
  ToggleKnowledgeInput,
} from "@/features/admin/knowledge/knowledge.types";
import type {
  UserFilters,
  UserListResult,
  UserStatusInput,
} from "@/features/admin/users/users.types";
import { apiRequest } from "@/services/http/api-client";
import type { AdminUser } from "@/types/domain/admin";

function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "ALL"
    ) {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

type JobDetailEnvelope = {
  job: Omit<JobDetail, "owner" | "aiCompletedCount" | "aiFailedCount" | "readinessIssues">;
  owner: JobDetail["owner"];
  aiCompletedCount: number;
  aiFailedCount: number;
  readinessIssues: string[];
};

export const httpAdminService = {
  getUsers(filters: UserFilters = {}) {
    return apiRequest<UserListResult>(
      `/api/v1/admin/users${queryString(filters)}`,
    );
  },

  getUser(userId: string) {
    return apiRequest<AdminUser>(`/api/v1/admin/users/${userId}`);
  },

  async getUserActivity(userId: string) {
    const result = await this.getActivities({
      targetType: "USER",
      targetId: userId,
      page: 0,
      size: 50,
    });
    return result.items;
  },

  updateUserStatus(input: UserStatusInput) {
    return apiRequest<AdminUser>(
      `/api/v1/admin/users/${input.userId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: input.status, reason: input.reason }),
      },
    );
  },

  getActivities(filters: ActivityFilters = {}) {
    return apiRequest<ActivityListResult>(
      `/api/v1/admin/activities${queryString(filters)}`,
    );
  },

  getJobFilterOptions() {
    return apiRequest<JobFilterOptions>("/api/v1/admin/jobs/filter-options");
  },

  getJobs(filters: JobFilters = {}) {
    return apiRequest<JobListResult>(
      `/api/v1/admin/jobs${queryString(filters)}`,
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

  getKnowledge() {
    return apiRequest<KnowledgeOverview>("/api/v1/admin/knowledge/overview");
  },

  getCompetency(id: string) {
    return apiRequest<CompetencyView>(
      `/api/v1/admin/knowledge/competencies/${id}`,
    );
  },

  saveJobFamily(input: JobFamilyInput) {
    const path = input.id
      ? `/api/v1/admin/knowledge/job-families/${input.id}`
      : "/api/v1/admin/knowledge/job-families";
    return apiRequest<JobFamilyView>(path, {
      method: input.id ? "PUT" : "POST",
      body: JSON.stringify({ name: input.name, description: input.description }),
    });
  },

  saveCareerLevel(input: CareerLevelInput) {
    const path = input.id
      ? `/api/v1/admin/knowledge/career-levels/${input.id}`
      : "/api/v1/admin/knowledge/career-levels";
    return apiRequest<CareerLevelView>(path, {
      method: input.id ? "PUT" : "POST",
      body: JSON.stringify({
        name: input.name,
        description: input.description,
        rankValue: input.rankValue,
      }),
    });
  },

  saveCompetency(input: CompetencyInput) {
    const path = input.id
      ? `/api/v1/admin/knowledge/competencies/${input.id}`
      : "/api/v1/admin/knowledge/competencies";
    return apiRequest<CompetencyView>(path, {
      method: input.id ? "PUT" : "POST",
      body: JSON.stringify({
        name: input.name,
        category: input.category,
        description: input.description,
      }),
    });
  },

  saveCompetencyLevels(id: string, levels: CompetencyView["levels"]) {
    return apiRequest<CompetencyView>(
      `/api/v1/admin/knowledge/competencies/${id}/levels`,
      {
        method: "PUT",
        body: JSON.stringify({ levels }),
      },
    );
  },

  toggleKnowledge(input: ToggleKnowledgeInput) {
    const entities = {
      JOB_FAMILY: "job-families",
      CAREER_LEVEL: "career-levels",
      COMPETENCY: "competencies",
    } as const;
    return apiRequest<KnowledgeOverview>(
      `/api/v1/admin/knowledge/${entities[input.entity]}/${input.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: input.status,
          force: input.force ?? false,
        }),
      },
    );
  },

  getApplications(filters: ApplicationFilters = {}) {
    return apiRequest<ApplicationListResult>(
      `/api/v1/admin/applications${queryString(filters)}`,
    );
  },

  getApplication(applicationId: string) {
    return apiRequest<ApplicationDetail>(
      `/api/v1/admin/applications/${applicationId}`,
    );
  },

  retryApplication(applicationId: string, idempotencyKey: string) {
    return apiRequest<AiRetryAccepted>(
      `/api/v1/admin/applications/${applicationId}/ai-retries`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
  },
};
