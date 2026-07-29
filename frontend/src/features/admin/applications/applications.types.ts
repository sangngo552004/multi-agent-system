import type {
  AdminJob,
  AdminUser,
  AiProcessingStatus,
} from "@/types/domain/admin";

export type ApplicationDateRange = "ALL" | "7" | "30";

export type ApplicationFilters = {
  search?: string;
  aiStatus?: AiProcessingStatus | "ALL";
  dateRange?: ApplicationDateRange;
  page?: number;
  size?: number;
  sort?: string;
};

export type ApplicationListItem = {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  departmentName: string;
  aiStatus: AiProcessingStatus;
  submittedAt: string;
  aiConfidence: number | null;
  needsReview: boolean;
  extractionMethod:
    | "TEXT_LAYER"
    | "OCR"
    | "LLM"
    | "LLM_FALLBACK"
    | null;
  errorCode: string | null;
  errorMessage: string | null;
  canRetry: boolean;
};

export type ApplicationListResult = {
  items: ApplicationListItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type AiPipelineStep = {
  id: "RECEIVED" | "EXTRACTION" | "MATCHING" | "CAREER_PATH" | "COMPLETED";
  label: string;
  status: "COMPLETED" | "ACTIVE" | "FAILED" | "PENDING" | "SKIPPED";
  message: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type ApplicationDetail = ApplicationListItem & {
  candidate: Pick<AdminUser, "id" | "fullName">;
  job: Pick<AdminJob, "id" | "title" | "departmentName">;
  pipeline: AiPipelineStep[];
  warningCount: number;
};

export type AiRetryAccepted = {
  applicationId: string;
  runId: string;
  status: "WAITING";
  acceptedAt: string;
};
