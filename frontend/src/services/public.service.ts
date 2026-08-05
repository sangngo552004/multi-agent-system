import { apiRequest } from "./http/api-client";
import type { JobFilterRequest, JobResponse } from "@/features/public/jobs/jobs.types";

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export const publicService = {
  getJobs: async (filters: JobFilterRequest): Promise<Page<JobResponse>> => {
    const params = new URLSearchParams();
    if (filters.search) params.append("keyword", filters.search);
    if (filters.departmentId) params.append("jobFamilyId", filters.departmentId);
    if (filters.careerLevelId) params.append("careerLevelId", filters.careerLevelId);
    if (filters.location) params.append("location", filters.location);
    if (filters.employmentType) params.append("employmentType", filters.employmentType);
    if (filters.page !== undefined) params.append("page", filters.page.toString());
    if (filters.size !== undefined) params.append("size", filters.size.toString());

    const qs = params.toString();
    const url = `/api/v1/jobs${qs ? `?${qs}` : ""}`;
    return apiRequest<Page<JobResponse>>(url, { authenticated: false });
  },
  getJobDetail: async (id: string): Promise<JobResponse> => {
    return apiRequest<JobResponse>(`/api/v1/jobs/${id}`, { authenticated: false });
  },
  verifyRegistration: async (token: string): Promise<string> => {
    return apiRequest<string>(`/api/v1/auth/verify?token=${token}`, { authenticated: false });
  },
  getJobFamilies: async (): Promise<unknown[]> => {
    return apiRequest<unknown[]>(`/api/v1/jobs/families`, { authenticated: false });
  },
  getCareerLevels: async (): Promise<unknown[]> => {
    return apiRequest<unknown[]>(`/api/v1/jobs/career-levels`, { authenticated: false });
  },
};
