"use client";

import { useQuery } from "@tanstack/react-query";
import { publicService } from "@/services/public.service";
import { publicQueryKeys } from "@/services/query-keys";
import type { JobFilterRequest } from "./jobs.types";

export function usePublicJobs(filters: JobFilterRequest = {}) {
  return useQuery({
    queryKey: publicQueryKeys.jobs(filters),
    queryFn: () => publicService.getJobs(filters),
    placeholderData: (previous) => previous,
  });
}

export function usePublicJob(jobId: string) {
  return useQuery({
    queryKey: publicQueryKeys.job(jobId),
    queryFn: () => publicService.getJobDetail(jobId),
    enabled: !!jobId,
  });
}

export function usePublicJobFamilies() {
  return useQuery({
    queryKey: ["public", "jobFamilies"],
    queryFn: () => publicService.getJobFamilies(),
  });
}

export function usePublicCareerLevels() {
  return useQuery({
    queryKey: ["public", "careerLevels"],
    queryFn: () => publicService.getCareerLevels(),
  });
}
