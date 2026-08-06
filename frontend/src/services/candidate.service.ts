import type { CvAnalysis } from "@/types/domain/cv-analysis";
import { apiRequest } from "./http/api-client";

export const candidateService = {
  extractCv: async (file: File): Promise<CvAnalysis> => {
    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/extract-cv`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to extract CV: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  getProfile: async (): Promise<unknown> => {
    return apiRequest<unknown>("/api/v1/candidate/profile", { authenticated: true });
  },

  updateProfile: async (payload: unknown): Promise<unknown> => {
    return apiRequest<unknown>("/api/v1/candidate/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
      authenticated: true,
    });
  },

  getMyApplications: async (): Promise<unknown[]> => {
    return apiRequest<unknown[]>("/api/v1/candidate/applications", { authenticated: true });
  },
};
