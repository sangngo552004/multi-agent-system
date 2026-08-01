import { apiClient } from './api-client';

export interface CandidateApplicationResponse {
  id: string;
  jobId: string;
  jobTitle: string;
  resumeUrl: string;
  status: string;
  careerPathAdvice: Record<string, unknown> | null;
  appliedAt: string;
  updatedAt: string;
}

export const CandidateApplicationService = {
  applyForJob: async (jobId: string, cvFile: File) => {
    const formData = new FormData();
    formData.append('cvFile', cvFile);
    return apiClient.post<CandidateApplicationResponse>(`/candidate/applications/jobs/${jobId}/apply`, formData);
  },

  getMyApplications: async () => {
    return apiClient.get<CandidateApplicationResponse[]>('/candidate/applications');
  },
};
