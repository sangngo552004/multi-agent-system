import type { DashboardRange } from "@/features/admin/dashboard/dashboard.types";
import type { ApplicationFilters } from "@/features/admin/applications/applications.types";
import type { JobFilters } from "@/features/admin/jobs/jobs.types";
import type { UserFilters } from "@/features/admin/users/users.types";
import type { HrDashboardRange } from "@/features/hr/dashboard/dashboard.types";
import type { HrJobFilters } from "@/features/hr/jobs/jobs.types";
import type { HrApplicationFilters } from "@/features/hr/applications/applications.types";
import type { TalentPoolFilters } from "@/features/hr/talent-pool/talent-pool.types";

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

export const hrQueryKeys = {
  all: ["hr"] as const,
  profile: ["hr", "profile"] as const,
  dashboard: (range: HrDashboardRange) => ["hr", "dashboard", range] as const,
  catalog: ["hr", "catalog"] as const,
  jobs: (filters: HrJobFilters) => ["hr", "jobs", filters] as const,
  job: (jobId: string) => ["hr", "jobs", "detail", jobId] as const,
  applications: (filters: HrApplicationFilters) => ["hr", "applications", filters] as const,
  application: (applicationId: string) => ["hr", "applications", "detail", applicationId] as const,
  talentPool: (filters: TalentPoolFilters) => ["hr", "talent-pool", filters] as const,
  notifications: ["hr", "notifications"] as const,
};
