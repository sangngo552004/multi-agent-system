"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApplicationFilters } from "@/features/admin/applications/applications.types";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 120_000;

export function useApplications(filters: ApplicationFilters) {
  return useQuery({
    queryKey: adminQueryKeys.applications(filters),
    queryFn: () => adminService.getApplications(filters),
    placeholderData: (previous) => previous,
  });
}

export function useApplication(applicationId: string) {
  const pollingStartedAt = useRef<number | null>(null);
  const query = useQuery({
    queryKey: adminQueryKeys.application(applicationId),
    queryFn: () => adminService.getApplication(applicationId),
    refetchInterval: (query) => {
      const application = query.state.data;
      const active =
        application?.aiStatus === "WAITING" ||
        application?.aiStatus === "PROCESSING";
      if (!active) {
        pollingStartedAt.current = null;
        return false;
      }
      pollingStartedAt.current ??= Date.now();
      return Date.now() - pollingStartedAt.current < POLL_TIMEOUT_MS
        ? POLL_INTERVAL_MS
        : false;
    },
  });
  const aiStatus = query.data?.aiStatus;
  const refetch = query.refetch;

  useEffect(() => {
    const resumePolling = () => {
      const active = aiStatus === "WAITING" || aiStatus === "PROCESSING";
      if (document.visibilityState !== "visible" || !active) return;
      pollingStartedAt.current = null;
      void refetch();
    };
    document.addEventListener("visibilitychange", resumePolling);
    return () =>
      document.removeEventListener("visibilitychange", resumePolling);
  }, [aiStatus, refetch]);

  return query;
}

export function useRetryApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      idempotencyKey,
    }: {
      applicationId: string;
      idempotencyKey: string;
    }) => adminService.retryApplication(applicationId, idempotencyKey),
    onSuccess: async (accepted) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.application(accepted.applicationId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "applications"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "activities"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "dashboard"],
        }),
      ]);
    },
  });
}
