import type { HrService } from "@/services/contracts/hr-service";
import { mockHrService } from "@/services/mock/mock-hr.service";
import { fetchApi } from "./api-client";
import type { ChangeHrJobStatusInput, HrCatalogOptions, HrJobDetail, HrJobFilters, HrJobListResult, SaveHrJobInput } from "@/features/hr/jobs/jobs.types";

export const httpHrService: HrService = {
  ...mockHrService,

  getCatalogOptions: async (): Promise<HrCatalogOptions> => {
    try {
      const [jobFamilies, careerLevels, competencies] = await Promise.all([
        fetchApi<Record<string, unknown>[]>("/hr/job-families"),
        fetchApi<Record<string, unknown>[]>("/hr/career-levels"),
        fetchApi<Record<string, unknown>[]>("/hr/competencies"),
      ]);
      return {
        jobFamilies: jobFamilies.filter((x) => x.isActive).map((x) => ({ id: x.id, name: x.name })),
        careerLevels: careerLevels.filter((x) => x.isActive).map((x) => ({ id: x.id, name: x.name })),
        competencies: competencies.filter((x) => x.isActive).map((x) => ({ id: x.id, name: x.name, category: x.category })),
      };
    } catch {
      return mockHrService.getCatalogOptions();
    }
  },

  getJobs: async (filters?: HrJobFilters): Promise<HrJobListResult> => {
    // Tạm thời vẫn dùng mock để hiển thị danh sách nếu backend chưa list được
    return mockHrService.getJobs(filters);
  },

  getJob: async (jobId: string): Promise<HrJobDetail> => {
    try {
      // Backend return Job response, we map it to HrJobDetail
      const job = await fetchApi<Record<string, unknown>>(`/hr/jobs/${jobId}`);
      return {
        ...mockHrService.getJob(jobId), // fallback for non-existing fields in backend
        id: job.id,
        title: job.title,
        location: job.location,
        employmentType: job.employmentType,
        status: job.status,
        description: job.description,
        requirements: job.requirements ? job.requirements.split('\n') : [""],
        benefits: job.benefits ? job.benefits.split('\n') : [""],
        jobFamilyId: job.jobFamily?.id,
        careerLevelId: job.careerLevel?.id,
        ruleIds: (job.institutionalRules || []).map((r: Record<string, unknown>) => r.id),
      } as unknown as HrJobDetail;
    } catch {
      return mockHrService.getJob(jobId);
    }
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
      ruleIds: input.values.ruleIds,
      competencies: input.values.competencies,
    };

    let savedJob: Record<string, unknown>;
    if (input.jobId) {
      savedJob = await fetchApi(`/hr/jobs/${input.jobId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      savedJob = await fetchApi('/hr/jobs', { method: 'POST', body: JSON.stringify(payload) });
    }

    if (input.publish) {
      savedJob = await fetchApi(`/hr/jobs/${savedJob.id}/publish`, { method: 'POST' });
    }

    return httpHrService.getJob(savedJob.id);
  },

  changeJobStatus: async (input: ChangeHrJobStatusInput): Promise<HrJobDetail> => {
    let endpoint = "";
    if (input.status === "OPEN") endpoint = "publish";
    else if (input.status === "CLOSED") endpoint = "close";

    if (endpoint) {
      await fetchApi(`/hr/jobs/${input.jobId}/${endpoint}`, { method: 'POST' });
    }
    return httpHrService.getJob(input.jobId);
  },

  duplicateJob: async (jobId: string): Promise<HrJobDetail> => {
    const duplicated = await fetchApi<Record<string, unknown>>(`/hr/jobs/${jobId}/duplicate`, { method: 'POST' });
    return httpHrService.getJob(duplicated.id);
  },
};
