import type { HrService } from "@/services/contracts/hr-service";
import { apiRequest } from "./api-client";
import { adminQueryString as buildQueryString } from "./http-admin.shared";
import type { ChangeHrJobStatusInput, HrCatalogOptions, HrJobDetail, HrJobFilters, HrJobListResult, SaveHrJobInput } from "@/features/hr/jobs/jobs.types";

export const httpHrService: HrService = {
  getCatalogOptions: async (): Promise<HrCatalogOptions> => {
    const [jobFamilies, careerLevels, competencies] = await Promise.all([
      apiRequest<{ content: Array<Record<string, unknown>> }>("/api/v1/hr/job-families?size=1000"),
      apiRequest<{ content: Array<Record<string, unknown>> }>("/api/v1/hr/career-levels?size=1000"),
      apiRequest<{ content: Array<Record<string, unknown>> }>("/api/v1/hr/competencies?size=1000"),
    ]);
    return {
      jobFamilies: (jobFamilies.content || []).filter((x) => Boolean(x.isActive)).map((x) => ({ id: String(x.id), name: String(x.name) })),
      careerLevels: (careerLevels.content || []).filter((x) => Boolean(x.isActive)).map((x) => ({ id: String(x.id), name: String(x.name) })),
      competencies: (competencies.content || []).filter((x) => Boolean(x.isActive)).map((x) => ({ id: String(x.id), name: String(x.name), category: String(x.category) })),
    };
  },

  getJobs: async (filters?: HrJobFilters): Promise<HrJobListResult> => {
    const page = await apiRequest<{ content: unknown[]; totalElements: number }>(`/api/v1/hr/jobs${buildQueryString(filters || {})}`);
    return {
      items: (page.content || []) as HrJobDetail[],
      total: page.totalElements || 0,
    };
  },

  getJob: async (jobId: string): Promise<HrJobDetail> => {
    // Backend return Job response, we map it to HrJobDetail
    const job = await apiRequest<Record<string, unknown>>(`/api/v1/hr/jobs/${jobId}`);
    return {
      id: job.id,
      title: job.title,
      location: job.location,
      employmentType: job.employmentType,
      status: job.status,
      description: job.description,
      requirements: job.requirements ? String(job.requirements).split('\n') : [""],
      benefits: job.benefits ? String(job.benefits).split('\n') : [""],
      jobFamilyId: job.jobFamilyId as string,
      careerLevelId: job.careerLevelId as string,
      ruleIds: ((job.institutionalRules as Record<string, unknown>[]) || []).map((r) => r.id as string),
      competencies: (job.competencies || job.requiredCompetencies || []) as unknown[],
    } as unknown as HrJobDetail;
  },

  saveJob: async (input: SaveHrJobInput): Promise<HrJobDetail> => {
    const payload = {
      title: input.values.title,
      location: input.values.location,
      employmentType: input.values.employmentType,
      description: input.values.description,
      requirements: input.values.requirementsText.join('\n'),
      benefits: input.values.benefitsText.join('\n'),
      jobFamilyId: input.values.jobFamilyId,
      careerLevelId: input.values.careerLevelId,
    };

    let savedJob: Record<string, unknown>;
    if (input.jobId) {
      savedJob = await apiRequest(`/api/v1/hr/jobs/${input.jobId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      savedJob = await apiRequest('/api/v1/hr/jobs', { method: 'POST', body: JSON.stringify(payload) });
    }

    if (input.values.ruleIds) {
      await apiRequest(`/api/v1/hr/jobs/${savedJob.id}/rules`, {
        method: 'PUT',
        body: JSON.stringify({ ruleIds: input.values.ruleIds })
      });
    }

    if (input.values.competencies) {
      await apiRequest(`/api/v1/hr/jobs/${savedJob.id}/competencies`, {
        method: 'PUT',
        body: JSON.stringify(input.values.competencies.map(c => ({
          competencyId: c.competencyId,
          weight: c.weight,
          requiredLevel: c.requiredLevel,
          isMandatory: c.isMandatory
        })))
      });
    }

    if (input.publish) {
      savedJob = await apiRequest(`/api/v1/hr/jobs/${savedJob.id}/publish`, { method: 'POST' });
    }

    return httpHrService.getJob(savedJob.id as string);
  },

  changeJobStatus: async (input: ChangeHrJobStatusInput): Promise<HrJobDetail> => {
    let endpoint = "";
    if (input.status === "PUBLISHED") endpoint = "publish";
    else if (input.status === "CLOSED") endpoint = "close";

    if (endpoint) {
      await apiRequest(`/api/v1/hr/jobs/${input.jobId}/${endpoint}`, { method: 'POST' });
    }
    return httpHrService.getJob(input.jobId);
  },

  duplicateJob: async (jobId: string): Promise<HrJobDetail> => {
    const duplicated = await apiRequest<Record<string, unknown>>(`/api/v1/hr/jobs/${jobId}/duplicate`, { method: 'POST' });
    return httpHrService.getJob(duplicated.id as string);
  },
};
