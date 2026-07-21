import type {
  AdminApplication,
  AdminJob,
  AdminUser,
  AiProcessingStatus,
  RecruitmentStatus,
} from "@/types/domain/admin";

export type ScoreBand = "ALL" | "HIGH" | "MEDIUM" | "LOW" | "UNSCORED";
export type ApplicationDateRange = "ALL" | "7" | "30";

export type ApplicationFilters = {
  search?: string;
  recruitmentStatus?: RecruitmentStatus | "ALL";
  aiStatus?: AiProcessingStatus | "ALL";
  scoreBand?: ScoreBand;
  dateRange?: ApplicationDateRange;
};

export type ApplicationListItem = AdminApplication & {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
};

export type AiPipelineStep = {
  id: "received" | "extraction" | "matching" | "career-path" | "completed";
  label: string;
  status: "COMPLETED" | "ACTIVE" | "FAILED" | "PENDING" | "SKIPPED";
  message: string;
};

export type ApplicationDetail = ApplicationListItem & {
  candidate: Pick<AdminUser, "id" | "fullName" | "email">;
  job: Pick<AdminJob, "id" | "title" | "companyName">;
  pipeline: AiPipelineStep[];
};
