import type {
  AdminApplication,
  AdminJob,
  AdminUser,
  AiProcessingStatus,
} from "@/types/domain/admin";

export type ApplicationDateRange = "ALL" | "7" | "30";

export type ApplicationFilters = {
  search?: string;
  aiStatus?: AiProcessingStatus | "ALL";
  dateRange?: ApplicationDateRange;
};

export type ApplicationListItem = Pick<AdminApplication,
  | "id"
  | "candidateId"
  | "jobId"
  | "aiStatus"
  | "submittedAt"
  | "aiConfidence"
  | "needsReview"
  | "extractionMethod"
  | "errorCode"
  | "errorMessage"
  | "canRetry"
> & {
  candidateName: string;
  jobTitle: string;
  departmentName: string;
};

export type AiPipelineStep = {
  id: "received" | "extraction" | "matching" | "career-path" | "completed";
  label: string;
  status: "COMPLETED" | "ACTIVE" | "FAILED" | "PENDING" | "SKIPPED";
  message: string;
};

export type ApplicationDetail = ApplicationListItem & {
  candidate: Pick<AdminUser, "id" | "fullName">;
  job: Pick<AdminJob, "id" | "title" | "departmentName">;
  pipeline: AiPipelineStep[];
  warningCount: number;
};
