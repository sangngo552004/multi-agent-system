import type { DashboardData, DashboardRange } from "@/features/admin/dashboard/dashboard.types";
import type {
  ApplicationDetail,
  ApplicationFilters,
  ApplicationListItem,
} from "@/features/admin/applications/applications.types";
import type {
  JobDetail,
  JobFilters,
  JobListResult,
} from "@/features/admin/jobs/jobs.types";
import type {
  CareerLevelInput,
  CompetencyInput,
  CompetencyView,
  JobFamilyInput,
  KnowledgeOverview,
  ToggleKnowledgeInput,
} from "@/features/admin/knowledge/knowledge.types";
import type {
  UserFilters,
  UserStatusInput,
} from "@/features/admin/users/users.types";
import type { ActivityEntry, AdminUser } from "@/types/domain/admin";
import type { CompetencyLevel } from "@/types/domain/admin";

export interface AdminService {
  getDashboard(range: DashboardRange): Promise<DashboardData>;
  getUsers(filters?: UserFilters): Promise<AdminUser[]>;
  getUser(userId: string): Promise<AdminUser>;
  getUserActivity(userId: string): Promise<ActivityEntry[]>;
  updateUserStatus(input: UserStatusInput): Promise<AdminUser>;
  getJobs(filters?: JobFilters): Promise<JobListResult>;
  getJob(jobId: string): Promise<JobDetail>;
  getApplications(filters?: ApplicationFilters): Promise<ApplicationListItem[]>;
  getApplication(applicationId: string): Promise<ApplicationDetail>;
  retryApplication(applicationId: string): Promise<ApplicationDetail>;
  getActivities(): Promise<ActivityEntry[]>;
  getKnowledge(): Promise<KnowledgeOverview>;
  getCompetency(id: string): Promise<CompetencyView>;
  saveJobFamily(input: JobFamilyInput): Promise<unknown>;
  saveCareerLevel(input: CareerLevelInput): Promise<unknown>;
  saveCompetency(input: CompetencyInput): Promise<CompetencyView>;
  saveCompetencyLevels(id: string, levels: CompetencyLevel[]): Promise<CompetencyView>;
  toggleKnowledge(input: ToggleKnowledgeInput): Promise<KnowledgeOverview>;
}
