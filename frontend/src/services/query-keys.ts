import type { DashboardRange } from "@/features/admin/dashboard/dashboard.types";
import type { ApplicationFilters } from "@/features/admin/applications/applications.types";
import type { JobFilters } from "@/features/admin/jobs/jobs.types";
import type { UserFilters } from "@/features/admin/users/users.types";

export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: (range: DashboardRange) => ["admin", "dashboard", range] as const,
  users: (filters: UserFilters) => ["admin", "users", filters] as const,
  user: (userId: string) => ["admin", "users", "detail", userId] as const,
  userActivity: (userId: string) => ["admin", "users", "activity", userId] as const,
  jobs: (filters: JobFilters) => ["admin", "jobs", filters] as const,
  job: (jobId: string) => ["admin", "jobs", "detail", jobId] as const,
  applications: (filters: ApplicationFilters) => ["admin", "applications", filters] as const,
  application: (applicationId: string) => ["admin", "applications", "detail", applicationId] as const,
  activities: ["admin", "activities"] as const,
  knowledge: ["admin", "knowledge"] as const,
  competency: (id: string) => ["admin", "knowledge", "competency", id] as const,
};
