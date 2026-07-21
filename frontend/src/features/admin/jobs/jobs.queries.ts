"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JobActionInput, JobFilters } from "@/features/admin/jobs/jobs.types";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";

export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: adminQueryKeys.jobs(filters),
    queryFn: () => adminService.getJobs(filters),
    placeholderData: (previous) => previous,
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: adminQueryKeys.job(jobId),
    queryFn: () => adminService.getJob(jobId),
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: JobActionInput) => adminService.updateJob(input),
    onSuccess: async (job) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.job(job.id) }),
      ]);
    },
  });
}
