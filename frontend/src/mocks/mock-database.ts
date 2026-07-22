import { activitySeeds } from "@/mocks/data/admin/activities";
import { applicationSeeds } from "@/mocks/data/admin/applications";
import { jobSeeds } from "@/mocks/data/admin/jobs";
import { careerLevelSeeds, competencySeeds, jobFamilySeeds } from "@/mocks/data/admin/knowledge";
import { userSeeds } from "@/mocks/data/admin/users";
import type {
  ActivityEntry,
  AdminApplication,
  AdminJob,
  AdminUser,
  CareerLevel,
  Competency,
  JobFamily,
} from "@/types/domain/admin";
import type {
  ApplicationStatusHistoryEntry,
  CareerPathGenerationStatus,
  HrApplicationNote,
  HrNotification,
  TalentPoolEntry,
} from "@/types/domain/hr";

export type MockDatabaseState = {
  users: AdminUser[];
  jobs: AdminJob[];
  applications: AdminApplication[];
  jobFamilies: JobFamily[];
  careerLevels: CareerLevel[];
  competencies: Competency[];
  activities: ActivityEntry[];
  applicationHistories: ApplicationStatusHistoryEntry[];
  applicationNotes: HrApplicationNote[];
  careerPathStatuses: Record<string, CareerPathGenerationStatus>;
  talentPoolEntries: TalentPoolEntry[];
  talentPoolConsents: Record<string, boolean>;
  hrNotifications: HrNotification[];
};

function createInitialState(): MockDatabaseState {
  return structuredClone({
    users: userSeeds,
    jobs: jobSeeds,
    applications: applicationSeeds,
    jobFamilies: jobFamilySeeds,
    careerLevels: careerLevelSeeds,
    competencies: competencySeeds,
    activities: activitySeeds,
    applicationHistories: applicationSeeds.map((application) => ({
      id: `history-${application.id}-submitted`,
      applicationId: application.id,
      toStatus: "PENDING" as const,
      actorId: application.candidateId,
      actorName: "Ứng viên",
      createdAt: application.submittedAt,
    })),
    applicationNotes: [],
    careerPathStatuses: Object.fromEntries(applicationSeeds.map((application) => [
      application.id,
      application.recruitmentStatus === "REJECTED"
        ? application.aiStatus === "COMPLETED" ? "READY" : "INSUFFICIENT_INPUT"
        : "NOT_STARTED",
    ])),
    talentPoolEntries: [
      {
        id: "talent-001", hrId: "usr-005", candidateId: "usr-003", applicationId: "app-002",
        jobFamilyId: "product-design", careerLevelId: "middle", labels: ["Thiết kế sản phẩm", "Ưu tiên Q4"],
        note: "Có tư duy sản phẩm tốt, phù hợp khi mở rộng nhóm thiết kế.",
        savedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
        retentionUntil: new Date(Date.now() + 174 * 86_400_000).toISOString(),
      },
      {
        id: "talent-002", hrId: "usr-005", candidateId: "usr-011", applicationId: "app-019",
        jobFamilyId: "data-analytics", careerLevelId: "middle", labels: ["Phân tích nghiệp vụ"],
        note: "Kinh nghiệm phối hợp liên phòng ban rõ ràng, nên giữ liên hệ.",
        savedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
        retentionUntil: new Date(Date.now() + 177 * 86_400_000).toISOString(),
      },
    ],
    talentPoolConsents: {
      "usr-002": true, "usr-003": true, "usr-006": true, "usr-011": true,
      "usr-012": true, "usr-022": true, "usr-009": false,
    },
    hrNotifications: [
      {
        id: "hr-notification-001", hrId: "usr-005", kind: "NEW_APPLICATION" as const,
        title: "Hồ sơ mới cho Product Designer", description: "Nguyễn Hoàng Nam vừa gửi hồ sơ ứng tuyển.",
        href: "/hr/applications/app-002", createdAt: new Date(Date.now() - 35 * 60_000).toISOString(),
      },
      {
        id: "hr-notification-002", hrId: "usr-005", kind: "AI_COMPLETED" as const,
        title: "Đã hoàn thành đối sánh", description: "Kết quả AI cho hồ sơ Business Analyst đã sẵn sàng để đối chiếu.",
        href: "/hr/applications/app-019", createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      },
      {
        id: "hr-notification-003", hrId: "usr-005", kind: "AI_FAILED" as const,
        title: "Một hồ sơ xử lý AI thất bại", description: "Hồ sơ app-026 vẫn có thể được đánh giá thủ công trong khi chờ hỗ trợ.",
        href: "/hr/applications/app-026", createdAt: new Date(Date.now() - 4 * 3_600_000).toISOString(),
      },
      {
        id: "hr-notification-004", hrId: "usr-005", kind: "JOB_EXPIRING" as const,
        title: "Tin sắp hết hạn", description: "Product Marketing Specialist còn 5 ngày nhận hồ sơ.",
        href: "/hr/jobs/job-014", createdAt: new Date(Date.now() - 8 * 3_600_000).toISOString(),
      },
      {
        id: "hr-notification-005", hrId: "usr-005", kind: "JOB_INCOMPLETE" as const,
        title: "Bản nháp cần hoàn thiện", description: "Product Operations Specialist chưa có cấu hình năng lực.",
        href: "/hr/jobs/job-013/edit", createdAt: new Date(Date.now() - 24 * 3_600_000).toISOString(),
        readAt: new Date(Date.now() - 20 * 3_600_000).toISOString(),
      },
    ],
  });
}

class MockDatabase {
  private state = createInitialState();

  snapshot(): MockDatabaseState {
    return structuredClone(this.state);
  }

  findUser(userId: string) {
    return this.state.users.find((user) => user.id === userId);
  }

  findJob(jobId: string) {
    return this.state.jobs.find((job) => job.id === jobId);
  }

  findApplication(applicationId: string) {
    return this.state.applications.find((application) => application.id === applicationId);
  }

  findCompetency(competencyId: string) {
    return this.state.competencies.find((item) => item.id === competencyId);
  }

  updateUser(userId: string, patch: Partial<AdminUser>) {
    const user = this.findUser(userId);
    if (!user) return undefined;
    Object.assign(user, patch);
    return structuredClone(user);
  }

  updateJob(jobId: string, patch: Partial<AdminJob>) {
    const job = this.findJob(jobId);
    if (!job) return undefined;
    Object.assign(job, patch);
    return structuredClone(job);
  }

  addJob(job: AdminJob) {
    this.state.jobs.unshift(structuredClone(job));
    return structuredClone(job);
  }

  updateApplication(applicationId: string, patch: Partial<AdminApplication>) {
    const application = this.findApplication(applicationId);
    if (!application) return undefined;
    Object.assign(application, patch);
    return structuredClone(application);
  }

  replaceJobFamilies(items: JobFamily[]) {
    this.state.jobFamilies = structuredClone(items);
  }

  replaceCareerLevels(items: CareerLevel[]) {
    this.state.careerLevels = structuredClone(items);
  }

  replaceCompetencies(items: Competency[]) {
    this.state.competencies = structuredClone(items);
  }

  addActivity(entry: ActivityEntry) {
    this.state.activities.unshift(entry);
  }

  addApplicationHistory(entry: ApplicationStatusHistoryEntry) {
    this.state.applicationHistories.unshift(structuredClone(entry));
  }

  addApplicationNote(note: HrApplicationNote) {
    this.state.applicationNotes.unshift(structuredClone(note));
  }

  addTalentPoolEntry(entry: TalentPoolEntry) {
    this.state.talentPoolEntries.unshift(structuredClone(entry));
    return structuredClone(entry);
  }

  updateTalentPoolEntry(entryId: string, patch: Partial<TalentPoolEntry>) {
    const entry = this.state.talentPoolEntries.find((item) => item.id === entryId);
    if (!entry) return undefined;
    Object.assign(entry, patch);
    return structuredClone(entry);
  }

  removeTalentPoolEntry(entryId: string) {
    const index = this.state.talentPoolEntries.findIndex((item) => item.id === entryId);
    if (index < 0) return false;
    this.state.talentPoolEntries.splice(index, 1);
    return true;
  }

  addHrNotification(notification: HrNotification) {
    this.state.hrNotifications.unshift(structuredClone(notification));
  }

  markHrNotificationRead(notificationId: string, readAt = new Date().toISOString()) {
    const notification = this.state.hrNotifications.find((item) => item.id === notificationId);
    if (!notification) return undefined;
    notification.readAt = readAt;
    return structuredClone(notification);
  }

  markAllHrNotificationsRead(hrId: string, readAt = new Date().toISOString()) {
    this.state.hrNotifications.forEach((item) => { if (item.hrId === hrId) item.readAt = readAt; });
  }

  setCareerPathStatus(applicationId: string, status: CareerPathGenerationStatus) {
    this.state.careerPathStatuses[applicationId] = status;
  }

  reset() {
    this.state = createInitialState();
  }
}

export const mockDatabase = new MockDatabase();
