"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AddHrApplicationNoteInput, HrApplicationFilters, UpdateHrApplicationStatusInput } from "@/features/hr/applications/applications.types";
import { hrService } from "@/services/hr.service";
import { hrQueryKeys } from "@/services/query-keys";

export function useHrApplications(filters: HrApplicationFilters) {
  return useQuery({ queryKey: hrQueryKeys.applications(filters), queryFn: () => hrService.getApplications(filters), placeholderData: (previous) => previous });
}

export function useHrApplication(applicationId: string) {
  return useQuery({ queryKey: hrQueryKeys.application(applicationId), queryFn: () => hrService.getApplication(applicationId) });
}

function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: hrQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["admin"] }),
  ]);
}

export function useUpdateHrApplicationStatus() {
  const invalidate = useInvalidateApplications();
  return useMutation({ mutationFn: (input: UpdateHrApplicationStatusInput) => hrService.updateApplicationStatus(input), onSuccess: invalidate });
}

export function useAddHrApplicationNote() {
  const invalidate = useInvalidateApplications();
  return useMutation({ mutationFn: (input: AddHrApplicationNoteInput) => hrService.addApplicationNote(input), onSuccess: invalidate });
}
