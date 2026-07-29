import type { ActivityEntry } from "@/types/domain/admin";

export type ActivityGroup = "ALL" | "ADMIN" | "CONTENT" | "AI" | "APPLICATION";

export type ActivityFilters = {
  search?: string;
  group?: ActivityGroup;
  targetType?: "USER" | "JOB" | "APPLICATION" | "KNOWLEDGE";
  targetId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
};

export type ActivityListResult = {
  items: ActivityEntry[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  summary: {
    total: number;
    last24Hours: number;
    aiRelated: number;
  };
};
