export type Competency = {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
};

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
  isActive: boolean;
};
