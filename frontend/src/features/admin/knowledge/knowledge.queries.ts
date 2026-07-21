"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CareerLevelInput, CompetencyInput, JobFamilyInput, ToggleKnowledgeInput } from "@/features/admin/knowledge/knowledge.types";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";
import type { CompetencyLevel } from "@/types/domain/admin";

export function useKnowledge() { return useQuery({ queryKey: adminQueryKeys.knowledge, queryFn: () => adminService.getKnowledge() }); }
export function useCompetency(id: string) { return useQuery({ queryKey: adminQueryKeys.competency(id), queryFn: () => adminService.getCompetency(id) }); }

function useKnowledgeMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: adminQueryKeys.all }); } });
}

export function useSaveJobFamily() { return useKnowledgeMutation<JobFamilyInput>((input) => adminService.saveJobFamily(input)); }
export function useSaveCareerLevel() { return useKnowledgeMutation<CareerLevelInput>((input) => adminService.saveCareerLevel(input)); }
export function useSaveCompetency() { return useKnowledgeMutation<CompetencyInput>((input) => adminService.saveCompetency(input)); }
export function useToggleKnowledge() { return useKnowledgeMutation<ToggleKnowledgeInput>((input) => adminService.toggleKnowledge(input)); }

export function useSaveCompetencyLevels(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (levels: CompetencyLevel[]) => adminService.saveCompetencyLevels(id, levels), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: adminQueryKeys.all }); } });
}
