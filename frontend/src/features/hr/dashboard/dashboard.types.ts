import type { JobStatus, RecruitmentStatus } from "@/types/domain/recruitment";

export type HrDashboardRange = 7 | 30;

export type HrDashboardMetric = {
  id: "open-jobs" | "new-applications" | "pending-review" | "shortlisted" | "expiring-jobs";
  label: string;
  value: number;
  note: string;
  href: string;
  emphasis?: boolean;
};

export type HrAttentionItem = {
  id: string;
  label: string;
  description: string;
  count: number;
  href: string;
  tone: "warning" | "danger" | "info";
};

export type HrTrendDatum = {
  date: string;
  label: string;
  applications: number;
};

export type HrFunnelDatum = {
  status: RecruitmentStatus;
  label: string;
  value: number;
  color: string;
};

export type HrActiveJob = {
  id: string;
  title: string;
  status: JobStatus;
  applicationCount: number;
  newApplicationCount: number;
  expiresAt: string;
  matchingReady: boolean;
};

export type HrDashboardData = {
  range: HrDashboardRange;
  generatedAt: string;
  hasData: boolean;
  metrics: HrDashboardMetric[];
  attention: HrAttentionItem[];
  trend: HrTrendDatum[];
  funnel: HrFunnelDatum[];
  activeJobs: HrActiveJob[];
};
