"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CareerLevelInput,
  CareerLevelView,
  CompetencyInput,
  JobFamilyInput,
  JobFamilyView,
  KnowledgeOverview,
  ToggleKnowledgeInput,
} from "@/features/admin/knowledge/knowledge.types";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";
import type { CompetencyLevel } from "@/types/domain/admin";

export function useKnowledge() {
  return useQuery({
    queryKey: adminQueryKeys.knowledge,
    queryFn: () => adminService.getKnowledge(),
  });
}

export function useCompetency(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.competency(id),
    queryFn: () => adminService.getCompetency(id),
  });
}

function useKnowledgeMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.knowledge }),
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.jobFilterOptions,
        }),
        queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] }),
      ]);
    },
  });
}

export function useSaveJobFamily() {
  return useKnowledgeMutation<JobFamilyInput, JobFamilyView>((input) =>
    adminService.saveJobFamily(input),
  );
}

export function useSaveCareerLevel() {
  return useKnowledgeMutation<CareerLevelInput, CareerLevelView>((input) =>
    adminService.saveCareerLevel(input),
  );
}

export function useSaveCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompetencyInput) => adminService.saveCompetency(input),
    onSuccess: async (competency) => {
      queryClient.setQueryData(
        adminQueryKeys.competency(competency.id),
        competency,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.knowledge }),
        queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] }),
      ]);
    },
  });
}

export function useToggleKnowledge() {
  return useKnowledgeMutation<ToggleKnowledgeInput, KnowledgeOverview>((input) =>
    adminService.toggleKnowledge(input),
  );
}

export function useSaveCompetencyLevels(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (levels: CompetencyLevel[]) =>
      adminService.saveCompetencyLevels(id, levels),
    onSuccess: async (competency) => {
      queryClient.setQueryData(adminQueryKeys.competency(id), competency);
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.knowledge,
      });
    },
  });
}
