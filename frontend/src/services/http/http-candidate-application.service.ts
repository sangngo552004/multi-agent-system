import { apiRequest } from './api-client';

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
    return apiRequest<CandidateApplicationResponse>(`/api/v1/candidate/applications/jobs/${jobId}/apply`, {
      method: 'POST',
      body: formData
    });
  },

  applyWithMasterCv: async (jobId: string) => {
    return apiRequest<CandidateApplicationResponse>(`/api/v1/candidate/applications/jobs/${jobId}/apply-master`, {
      method: 'POST'
    });
  },

  uploadMasterCv: async (cvFile: File) => {
    const formData = new FormData();
    formData.append('cvFile', cvFile);
    return apiRequest<void>('/api/v1/candidate/profile/cv', {
      method: 'POST',
      body: formData
    });
  },

  getMyApplications: async () => {
    return apiRequest<CandidateApplicationResponse[]>('/api/v1/candidate/applications');
  },
};
