import type {
  RecruitmentApplication,
  RecruitmentJob,
  SystemUser,
} from "@/types/domain/recruitment";

export type {
  AiErrorCode,
  AiProcessingStatus,
  CandidateEducation,
  CandidateExperience,
  CareerPathPhase,
  EmploymentType,
  JobCompetencyRequirement,
  JobStatus,
  RecruitmentStatus,
  UserRole,
  UserStatus,
} from "@/types/domain/recruitment";

export type AdminUser = SystemUser;
export type AdminJob = RecruitmentJob;
export type AdminApplication = RecruitmentApplication;

export type ActivityKind =
  | "USER_STATUS_CHANGED"
  | "STAFF_PROFILE_SYNCED"
  | "JOB_STATUS_CHANGED"
  | "AI_RETRY_COMPLETED"
  | "KNOWLEDGE_CHANGED"
  | "JOB_UPDATED"
  | "AI_PROCESSING_FAILED"
  | "APPLICATION_STATUS_CHANGED"
  | "APPLICATION_SUBMITTED";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  actorName: string;
  description: string;
  targetLabel: string;
  targetHref?: string;
  createdAt: string;
};

export type KnowledgeItemStatus = "ACTIVE" | "INACTIVE";

export type JobFamily = {
  id: string;
  name: string;
  description: string;
  status: KnowledgeItemStatus;
};

export type CareerLevel = {
  id: string;
  name: string;
  description: string;
  rankValue: number;
  status: KnowledgeItemStatus;
};

export type CompetencyLevel = {
  level: number;
  title: string;
  description: string;
};

export type Competency = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: KnowledgeItemStatus;
  levels: CompetencyLevel[];
};
