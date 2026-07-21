"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildAiPipeline } from "@/features/admin/applications/application-pipeline";
import type { ApplicationFilters } from "@/features/admin/applications/applications.types";
import type { ApplicationDetail } from "@/features/admin/applications/applications.types";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";

export function useApplications(filters: ApplicationFilters) {
  return useQuery({
    queryKey: adminQueryKeys.applications(filters),
    queryFn: () => adminService.getApplications(filters),
    placeholderData: (previous) => previous,
  });
}

export function useApplication(applicationId: string) {
  return useQuery({
    queryKey: adminQueryKeys.application(applicationId),
    queryFn: () => adminService.getApplication(applicationId),
  });
}

export function useRetryApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => adminService.retryApplication(applicationId),
    onMutate: async (applicationId) => {
      const key = adminQueryKeys.application(applicationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApplicationDetail>(key);
      queryClient.setQueryData<ApplicationDetail>(key, (current) => transitionAiStatus(current, "WAITING"));
      const processingTimer = window.setTimeout(() => {
        queryClient.setQueryData<ApplicationDetail>(key, (current) => transitionAiStatus(current, "PROCESSING"));
      }, 650);
      return { previous, processingTimer };
    },
    onError: (_error, applicationId, context) => {
      window.clearTimeout(context?.processingTimer);
      if (context?.previous) queryClient.setQueryData(adminQueryKeys.application(applicationId), context.previous);
    },
    onSuccess: async (application, _applicationId, context) => {
      window.clearTimeout(context?.processingTimer);
      queryClient.setQueryData(adminQueryKeys.application(application.id), application);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.application(application.id) }),
      ]);
    },
  });
}

function transitionAiStatus(application: ApplicationDetail | undefined, aiStatus: "WAITING" | "PROCESSING") {
  if (!application) return application;
  const updated: ApplicationDetail = {
    ...application,
    aiStatus,
    errorCode: undefined,
    errorMessage: undefined,
    canRetry: false,
  };
  return { ...updated, pipeline: buildAiPipeline(updated) };
}
