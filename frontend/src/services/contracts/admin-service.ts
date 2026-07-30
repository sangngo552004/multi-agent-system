import type { DashboardData, DashboardRange } from "@/features/admin/dashboard/dashboard.types";
import type {
  ApplicationDetail,
  ApplicationFilters,
  ApplicationListResult,
  AiRetryAccepted,
} from "@/features/admin/applications/applications.types";
import type {
  JobDetail,
  JobFilterOptions,
  JobFilters,
  JobListResult,
} from "@/features/admin/jobs/jobs.types";
import type {
  CareerLevelInput,
  CareerLevelView,
  CompetencyInput,
  CompetencyView,
  JobFamilyInput,
  JobFamilyView,
  KnowledgeOverview,
  ToggleKnowledgeInput,
} from "@/features/admin/knowledge/knowledge.types";
import type {
  UserFilters,
  UserListResult,
  UserStatusInput,
} from "@/features/admin/users/users.types";
import type { ActivityEntry, AdminUser } from "@/types/domain/admin";
import type {
  ActivityFilters,
  ActivityListResult,
} from "@/features/admin/activity/activity.types";
import type { CompetencyLevel } from "@/types/domain/admin";

export interface AdminService {
  getDashboard(range: DashboardRange): Promise<DashboardData>;
  getUsers(filters?: UserFilters): Promise<UserListResult>;
  getUser(userId: string): Promise<AdminUser>;
  getUserActivity(userId: string): Promise<ActivityEntry[]>;
  updateUserStatus(input: UserStatusInput): Promise<AdminUser>;
  getJobs(filters?: JobFilters): Promise<JobListResult>;
  getJobFilterOptions(): Promise<JobFilterOptions>;
  getJob(jobId: string): Promise<JobDetail>;
  getApplications(filters?: ApplicationFilters): Promise<ApplicationListResult>;
  getApplication(applicationId: string): Promise<ApplicationDetail>;
  retryApplication(
    applicationId: string,
    idempotencyKey: string,
  ): Promise<AiRetryAccepted>;
  getActivities(filters?: ActivityFilters): Promise<ActivityListResult>;
  getKnowledge(): Promise<KnowledgeOverview>;
  getCompetency(id: string): Promise<CompetencyView>;
  saveJobFamily(input: JobFamilyInput): Promise<JobFamilyView>;
  saveCareerLevel(input: CareerLevelInput): Promise<CareerLevelView>;
  saveCompetency(input: CompetencyInput): Promise<CompetencyView>;
  saveCompetencyLevels(id: string, levels: CompetencyLevel[]): Promise<CompetencyView>;
  toggleKnowledge(input: ToggleKnowledgeInput): Promise<KnowledgeOverview>;
}
