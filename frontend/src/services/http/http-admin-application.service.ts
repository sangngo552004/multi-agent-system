"use client";

import type {
  AiRetryAccepted,
  ApplicationDetail,
  ApplicationFilters,
  ApplicationListResult,
} from "@/features/admin/applications/applications.types";
import { apiRequest } from "@/services/http/api-client";
import { adminQueryString } from "@/services/http/http-admin.shared";

export const httpAdminApplicationService = {
  getApplications(filters: ApplicationFilters = {}) {
    return apiRequest<ApplicationListResult>(
      `/api/v1/admin/applications${adminQueryString(filters)}`,
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
