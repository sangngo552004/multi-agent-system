import type { ActivityEntry, AiProcessingStatus } from "@/types/domain/admin";

export type DashboardRange = 7 | 30;

export type DashboardMetric = {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  change?: string;
  href: string;
  emphasis?: boolean;
};

export type AttentionItem = {
  id: string;
  label: string;
  description: string;
  count: number;
  href: string;
  tone: "warning" | "danger" | "info";
};

export type AiStatusDatum = {
  status: AiProcessingStatus;
  label: string;
  value: number;
  color: string;
};

export type TrendDatum = {
  date: string;
  label: string;
  applications: number;
};

export type DashboardData = {
  range: DashboardRange;
  generatedAt: string;
  hasData: boolean;
  metrics: DashboardMetric[];
  attention: AttentionItem[];
  aiStatuses: AiStatusDatum[];
  trend: TrendDatum[];
  recentActivities: ActivityEntry[];
};
