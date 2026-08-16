"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest as fetchApi } from "@/services/http/api-client";
import type { CareerLevel, Competency, CompetencyLevel, InstitutionalRule, JobFamily, PedigreeEntity, PedigreeGroup } from "./knowledge-base.types";
import type { CareerLevelFormValues, CompetencyFormValues, InstitutionalRuleFormValues, JobFamilyFormValues } from "./knowledge-base.schema";
import { hrQueryKeys } from "@/services/query-keys";

type PageResult<T> = { content: T[] };
const hrPath = (path: string) => `/api/v1/hr${path}`;

// Keys
export const kbQueryKeys = {
  all: ["knowledge-base"] as const,
  competencies: () => [...kbQueryKeys.all, "competencies"] as const,
  jobFamilies: () => [...kbQueryKeys.all, "jobFamilies"] as const,
  careerLevels: () => [...kbQueryKeys.all, "careerLevels"] as const,
  rules: () => [...kbQueryKeys.all, "rules"] as const,
  pedigrees: () => [...kbQueryKeys.all, "pedigrees"] as const,
  pedigreeGroups: () => [...kbQueryKeys.all, "pedigree-groups"] as const,
};

// --- Competencies ---
export function useCompetencies() {
  return useQuery({ queryKey: kbQueryKeys.competencies(), queryFn: async () => (await fetchApi<PageResult<Competency>>(hrPath("/competencies?size=1000"))).content });
}
export function useSaveCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CompetencyFormValues }) => {
      const payload = { name: data.name, description: data.description, category: data.category };
      return id
        ? fetchApi<Competency>(hrPath(`/competencies/${id}`), { method: "PUT", body: JSON.stringify(payload) })
        : fetchApi<Competency>(hrPath("/competencies"), { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: kbQueryKeys.competencies() }); queryClient.invalidateQueries({ queryKey: hrQueryKeys.catalog }); }
  });
}
export function useDeleteCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi<void>(hrPath(`/competencies/${id}`), { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: kbQueryKeys.competencies() }); queryClient.invalidateQueries({ queryKey: hrQueryKeys.catalog }); }
  });
}
export function useCompetencyLevels(competencyId: string | null) {
  return useQuery({ queryKey: [...kbQueryKeys.competencies(), competencyId, "levels"], enabled: Boolean(competencyId), queryFn: () => fetchApi<CompetencyLevel[]>(hrPath(`/competencies/${competencyId}/levels`)) });
}
export function useSaveCompetencyLevels() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ competencyId, levels }: { competencyId: string; levels: CompetencyLevel[] }) => fetchApi(hrPath(`/competencies/${competencyId}/levels`), { method: "PUT", body: JSON.stringify({ levels: levels.map(({ level, label, description }) => ({ level, title: label, description })) }) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: kbQueryKeys.competencies() }) });
}

// --- Job Families ---
export function useJobFamilies() {
  return useQuery({ queryKey: kbQueryKeys.jobFamilies(), queryFn: async () => (await fetchApi<PageResult<JobFamily>>(hrPath("/job-families?size=1000"))).content });
}
export function useSaveJobFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: JobFamilyFormValues }) =>
      id ? fetchApi<JobFamily>(hrPath(`/job-families/${id}`), { method: "PUT", body: JSON.stringify(data) })
         : fetchApi<JobFamily>(hrPath("/job-families"), { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: kbQueryKeys.jobFamilies() }); queryClient.invalidateQueries({ queryKey: hrQueryKeys.catalog }); }
  });
}
export function useDeleteJobFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi<void>(hrPath(`/job-families/${id}`), { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: kbQueryKeys.jobFamilies() }); queryClient.invalidateQueries({ queryKey: hrQueryKeys.catalog }); }
  });
}

// --- Career Levels ---
export function useCareerLevels() {
  return useQuery({ queryKey: kbQueryKeys.careerLevels(), queryFn: async () => (await fetchApi<PageResult<CareerLevel>>(hrPath("/career-levels?size=1000"))).content });
}
export function useSaveCareerLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CareerLevelFormValues }) =>
      id ? fetchApi<CareerLevel>(hrPath(`/career-levels/${id}`), { method: "PUT", body: JSON.stringify(data) })
         : fetchApi<CareerLevel>(hrPath("/career-levels"), { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: kbQueryKeys.careerLevels() }); queryClient.invalidateQueries({ queryKey: hrQueryKeys.catalog }); }
  });
}
export function useDeleteCareerLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi<void>(hrPath(`/career-levels/${id}`), { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: kbQueryKeys.careerLevels() }); queryClient.invalidateQueries({ queryKey: hrQueryKeys.catalog }); }
  });
}

// --- Rules ---
export function useRules() {
  return useQuery({ queryKey: kbQueryKeys.rules(), queryFn: async () => (await fetchApi<PageResult<InstitutionalRule>>(hrPath("/rules?size=1000"))).content });
}
export function usePedigrees() {
  return useQuery({ queryKey: kbQueryKeys.pedigrees(), queryFn: () => fetchApi<PedigreeEntity[]>(hrPath("/knowledge-base/pedigrees")) });
}
export function usePedigreeGroups() {
  return useQuery({ queryKey: kbQueryKeys.pedigreeGroups(), queryFn: () => fetchApi<PedigreeGroup[]>(hrPath("/knowledge-base/pedigree-groups")) });
}
export function useCreatePedigree() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (data: Record<string, unknown>) => fetchApi<PedigreeEntity>(hrPath("/knowledge-base/pedigrees"), { method: "POST", body: JSON.stringify(data) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: kbQueryKeys.pedigrees() }) }); }
export function useCreatePedigreeGroup() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (data: Record<string, unknown>) => fetchApi<PedigreeGroup>(hrPath("/knowledge-base/pedigree-groups"), { method: "POST", body: JSON.stringify(data) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: kbQueryKeys.pedigreeGroups() }) }); }
export function useSavePedigree() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id?: string; data: Record<string, unknown> }) => fetchApi<PedigreeEntity>(hrPath(`/knowledge-base/pedigrees${id ? `/${id}` : ""}`), { method: id ? "PUT" : "POST", body: JSON.stringify(data) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: kbQueryKeys.pedigrees() }) }); }
export function useDeletePedigree() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (id: string) => fetchApi<void>(hrPath(`/knowledge-base/pedigrees/${id}`), { method: "DELETE" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: kbQueryKeys.pedigrees() }) }); }
export function useSavePedigreeGroup() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id?: string; data: Record<string, unknown> }) => fetchApi<PedigreeGroup>(hrPath(`/knowledge-base/pedigree-groups${id ? `/${id}` : ""}`), { method: id ? "PUT" : "POST", body: JSON.stringify(data) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: kbQueryKeys.pedigreeGroups() }) }); }
export function useSaveRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: InstitutionalRuleFormValues }) =>
      id ? fetchApi<InstitutionalRule>(hrPath(`/rules/${id}`), { method: "PUT", body: JSON.stringify(data) })
         : fetchApi<InstitutionalRule>(hrPath("/rules"), { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: kbQueryKeys.rules() })
  });
}
export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi<void>(hrPath(`/rules/${id}`), { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: kbQueryKeys.rules() })
  });
}
