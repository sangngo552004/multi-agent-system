"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangeHrJobStatusInput, HrJobFilters, SaveHrJobInput } from "@/features/hr/jobs/jobs.types";
import { hrService } from "@/services/hr.service";
import { hrQueryKeys } from "@/services/query-keys";

export function useHrCatalogOptions() {
  return useQuery({ queryKey: hrQueryKeys.catalog, queryFn: () => hrService.getCatalogOptions() });
}

export function useHrJobs(filters: HrJobFilters) {
  return useQuery({
    queryKey: hrQueryKeys.jobs(filters),
    queryFn: () => hrService.getJobs(filters),
    placeholderData: (previous) => previous,
  });
}

export function useHrJob(jobId: string) {
  return useQuery({ queryKey: hrQueryKeys.job(jobId), queryFn: () => hrService.getJob(jobId) });
}

function useInvalidateRecruitmentData() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
    ]);
  };
}

export function useSaveHrJob() {
  const invalidate = useInvalidateRecruitmentData();
  return useMutation({ mutationFn: (input: SaveHrJobInput) => hrService.saveJob(input), onSuccess: invalidate });
}

export function useChangeHrJobStatus() {
  const invalidate = useInvalidateRecruitmentData();
  return useMutation({ mutationFn: (input: ChangeHrJobStatusInput) => hrService.changeJobStatus(input), onSuccess: invalidate });
}

export function useDuplicateHrJob() {
  const invalidate = useInvalidateRecruitmentData();
  return useMutation({ mutationFn: (jobId: string) => hrService.duplicateJob(jobId), onSuccess: invalidate });
}
