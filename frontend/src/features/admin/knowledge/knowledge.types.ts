import type { CareerLevel, Competency, JobFamily, KnowledgeItemStatus } from "@/types/domain/admin";

export type JobFamilyView = JobFamily & { usageCount: number };
export type CareerLevelView = CareerLevel & { usageCount: number };
export type CompetencyView = Competency & { usageCount: number; completedLevels: number };

export type KnowledgeOverview = {
  jobFamilies: JobFamilyView[];
  careerLevels: CareerLevelView[];
  competencies: CompetencyView[];
};

export type JobFamilyInput = {
  id?: string;
  name: string;
  description: string;
};

export type CareerLevelInput = JobFamilyInput & { rankValue: number };

export type CompetencyInput = {
  id?: string;
  name: string;
  category: string;
  description: string;
};

export type KnowledgeEntity = "JOB_FAMILY" | "CAREER_LEVEL" | "COMPETENCY";

export type ToggleKnowledgeInput = {
  entity: KnowledgeEntity;
  id: string;
  status: KnowledgeItemStatus;
  force?: boolean;
};
