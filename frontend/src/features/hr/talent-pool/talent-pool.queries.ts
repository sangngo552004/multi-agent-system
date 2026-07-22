"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SaveTalentPoolInput, TalentPoolFilters, UpdateTalentPoolInput } from "@/features/hr/talent-pool/talent-pool.types";
import { hrService } from "@/services/hr.service";
import { hrQueryKeys } from "@/services/query-keys";

export function useTalentPool(filters: TalentPoolFilters) {
  return useQuery({ queryKey: hrQueryKeys.talentPool(filters), queryFn: () => hrService.getTalentPool(filters), placeholderData: (previous) => previous });
}

function useInvalidateTalentPool() {
  const client = useQueryClient();
  return async () => Promise.all([client.invalidateQueries({ queryKey: hrQueryKeys.all }), client.invalidateQueries({ queryKey: ["admin"] })]);
}

export function useSaveTalentPoolEntry() {
  const invalidate = useInvalidateTalentPool();
  return useMutation({ mutationFn: (input: SaveTalentPoolInput) => hrService.saveTalentPoolEntry(input), onSuccess: invalidate });
}

export function useUpdateTalentPoolEntry() {
  const invalidate = useInvalidateTalentPool();
  return useMutation({ mutationFn: (input: UpdateTalentPoolInput) => hrService.updateTalentPoolEntry(input), onSuccess: invalidate });
}

export function useRemoveTalentPoolEntry() {
  const invalidate = useInvalidateTalentPool();
  return useMutation({ mutationFn: (entryId: string) => hrService.removeTalentPoolEntry(entryId), onSuccess: invalidate });
}
