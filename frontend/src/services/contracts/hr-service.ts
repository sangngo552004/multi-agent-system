import type {
  HrDashboardData,
  HrDashboardRange,
} from "@/features/hr/dashboard/dashboard.types";
import type {
  HrCatalogOptions,
  HrJobDetail,
  HrJobFilters,
  HrJobListResult,
  SaveHrJobInput,
  ChangeHrJobStatusInput,
} from "@/features/hr/jobs/jobs.types";
import type { SystemUser } from "@/types/domain/recruitment";
import type { AddHrApplicationNoteInput, HrApplicationDetail, HrApplicationFilters, HrApplicationListItem, UpdateHrApplicationStatusInput } from "@/features/hr/applications/applications.types";
import type { HrApplicationNote } from "@/types/domain/hr";
import type { HrNotification } from "@/types/domain/hr";
import type { SaveTalentPoolInput, TalentPoolFilters, TalentPoolListItem, UpdateTalentPoolInput } from "@/features/hr/talent-pool/talent-pool.types";

export interface HrService {
  getCurrentHr(): Promise<SystemUser>;
  getDashboard(range: HrDashboardRange): Promise<HrDashboardData>;
  getCatalogOptions(): Promise<HrCatalogOptions>;
  getJobs(filters?: HrJobFilters): Promise<HrJobListResult>;
  getJob(jobId: string): Promise<HrJobDetail>;
  saveJob(input: SaveHrJobInput): Promise<HrJobDetail>;
  changeJobStatus(input: ChangeHrJobStatusInput): Promise<HrJobDetail>;
  duplicateJob(jobId: string): Promise<HrJobDetail>;
  getApplications(filters?: HrApplicationFilters): Promise<HrApplicationListItem[]>;
  getApplication(applicationId: string): Promise<HrApplicationDetail>;
  updateApplicationStatus(input: UpdateHrApplicationStatusInput): Promise<HrApplicationDetail>;
  addApplicationNote(input: AddHrApplicationNoteInput): Promise<HrApplicationNote>;
  getTalentPool(filters?: TalentPoolFilters): Promise<TalentPoolListItem[]>;
  saveTalentPoolEntry(input: SaveTalentPoolInput): Promise<TalentPoolListItem>;
  updateTalentPoolEntry(input: UpdateTalentPoolInput): Promise<TalentPoolListItem>;
  removeTalentPoolEntry(entryId: string): Promise<void>;
  getNotifications(): Promise<HrNotification[]>;
  markNotificationRead(notificationId: string): Promise<HrNotification>;
  markAllNotificationsRead(): Promise<void>;
}
