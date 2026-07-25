import type { CvAnalysis } from "@/types/domain/cv-analysis";

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
};
