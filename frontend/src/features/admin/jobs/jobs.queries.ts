"use client";

import { useQuery } from "@tanstack/react-query";
import type { JobFilters } from "@/features/admin/jobs/jobs.types";
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
