import type { RecruitmentStatus } from "@/types/domain/recruitment";

export type CareerPathGenerationStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "READY"
  | "REVIEW_REQUIRED"
  | "INSUFFICIENT_INPUT"
  | "FAILED";

export type ApplicationStatusHistoryEntry = {
  id: string;
  applicationId: string;
  fromStatus?: RecruitmentStatus;
  toStatus: RecruitmentStatus;
  actorId: string;
  actorName: string;
  reason?: string;
  createdAt: string;
};

export type HrApplicationNote = {
  id: string;
  applicationId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type TalentPoolEntry = {
  id: string;
  hrId: string;
  candidateId: string;
  applicationId: string;
  jobFamilyId?: string;
  careerLevelId?: string;
  labels: string[];
  note: string;
  savedAt: string;
  retentionUntil: string;
};

export type HrNotificationKind =
  | "NEW_APPLICATION"
  | "AI_COMPLETED"
  | "AI_FAILED"
  | "JOB_EXPIRING"
  | "JOB_INCOMPLETE"
  | "ADMIN_RESOLVED";

export type HrNotification = {
  id: string;
  hrId: string;
  kind: HrNotificationKind;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  readAt?: string;
};
