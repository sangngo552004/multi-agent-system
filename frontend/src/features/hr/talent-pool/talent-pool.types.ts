import type { TalentPoolEntry } from "@/types/domain/hr";

export type TalentPoolFilters = {
  search?: string;
  jobFamilyId?: string | "ALL";
  careerLevelId?: string | "ALL";
  label?: string | "ALL";
};

export type TalentPoolListItem = TalentPoolEntry & {
  candidateName: string;
  candidateEmail: string;
  previousJobTitle: string;
  jobFamilyName?: string;
  careerLevelName?: string;
  skills: string[];
  matchScore?: number;
  expired: boolean;
};

export type SaveTalentPoolInput = {
  applicationId: string;
  labels: string[];
  note: string;
  retentionUntil: string;
};

export type UpdateTalentPoolInput = Omit<SaveTalentPoolInput, "applicationId"> & { entryId: string };
