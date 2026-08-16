export type Competency = {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
};
export type CompetencyLevel = { level: number; label: string; description: string };

export type JobFamily = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};

export type CareerLevel = {
  id: string;
  name: string;
  description: string;
  rankValue: number;
  isActive: boolean;
};

export type InstitutionalRule = {
  id: string;
  ruleCode: string;
  name: string;
  description: string;
  bonusPoints: number;
  maxImpactPercent: number;
  appliesToDomain: string;
  pedigreeGroup?: { id: string; name: string; code: string; evidenceSource: EvidenceSource };
  jobFamilies?: JobFamily[];
  isActive: boolean;
};

export type EvidenceSource = "EXPERIENCE" | "EDUCATION" | "CERTIFICATION" | "GPA";
export type PedigreeEntity = {
  id: string; name: string; type: "UNIVERSITY" | "COMPANY" | "AGENCY";
  rank: "INTERNATIONAL" | "TIER_1" | "TIER_2" | "TIER_3"; domain: string; country: string;
  aliases: string[]; isActive: boolean;
};
export type PedigreeGroup = { id: string; code: string; name: string; evidenceSource: EvidenceSource; isActive: boolean; memberIds: string[] };
