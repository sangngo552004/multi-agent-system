import { apiClient } from './api-client';

export interface JobResponse {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: string;
}

export const CandidateJobService = {
  getJobDetail: async (jobId: string) => {
    return apiClient.get<JobResponse>(`/candidate/jobs/${jobId}`);
  },
};
