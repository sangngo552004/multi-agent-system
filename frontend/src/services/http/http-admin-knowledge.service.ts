"use client";

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
import { apiRequest } from "@/services/http/api-client";

export const httpAdminKnowledgeService = {
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
      body: JSON.stringify({
        name: input.name,
        description: input.description,
      }),
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
};
