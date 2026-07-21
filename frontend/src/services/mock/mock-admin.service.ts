import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { DashboardData, DashboardRange } from "@/features/admin/dashboard/dashboard.types";
import type { ApplicationFilters } from "@/features/admin/applications/applications.types";
import type { JobActionInput, JobFilters } from "@/features/admin/jobs/jobs.types";
import type { CareerLevelInput, CompetencyInput, JobFamilyInput, ToggleKnowledgeInput } from "@/features/admin/knowledge/knowledge.types";
import type {
  UserFilters,
  UserStatusInput,
  VerificationInput,
} from "@/features/admin/users/users.types";
import { CURRENT_ADMIN_ID } from "@/lib/constants";
import { mockDatabase } from "@/mocks/mock-database";
import { getMockScenario } from "@/mocks/mock-scenarios";
import type { AdminService } from "@/services/contracts/admin-service";
import { mockJobService } from "@/services/mock/mock-job.service";
import { mockApplicationService } from "@/services/mock/mock-application.service";
import { mockKnowledgeService } from "@/services/mock/mock-knowledge.service";
import type { CompetencyLevel } from "@/types/domain/admin";
import type { ActivityEntry, AdminUser, AiProcessingStatus } from "@/types/domain/admin";

const QUERY_DELAY = 360;
const MUTATION_DELAY = 560;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export class MockApiError extends Error {
  constructor(message: string, public code = "MOCK_API_ERROR") {
    super(message);
    this.name = "MockApiError";
  }
}

function createActivity(
  kind: ActivityEntry["kind"],
  description: string,
  user: AdminUser,
): ActivityEntry {
  return {
    id: `act-${Date.now()}`,
    kind,
    actorName: "Admin Nguyễn",
    description,
    targetLabel: user.fullName,
    targetHref: `/admin/users/${user.id}`,
    createdAt: new Date().toISOString(),
  };
}

function emptyDashboard(range: DashboardRange): DashboardData {
  return {
    range,
    generatedAt: new Date().toISOString(),
    hasData: false,
    metrics: [],
    attention: [],
    aiStatuses: [],
    trend: [],
    recentActivities: [],
  };
}

class MockAdminService implements AdminService {
  async getDashboard(range: DashboardRange): Promise<DashboardData> {
    await delay(QUERY_DELAY);
    const scenario = getMockScenario();
    if (scenario === "empty") return emptyDashboard(range);
    if (scenario === "ai-error") {
      throw new MockApiError("Không thể tổng hợp trạng thái xử lý AI.", "AI_SUMMARY_UNAVAILABLE");
    }

    const { users, jobs, applications, activities } = mockDatabase.snapshot();
    const rangeStart = Date.now() - range * 86_400_000;
    const applicationsInRange = applications.filter(
      (item) => new Date(item.submittedAt).getTime() >= rangeStart,
    );
    const completedCount = applicationsInRange.filter((item) => item.aiStatus === "COMPLETED").length;
    const statusOrder: AiProcessingStatus[] = ["COMPLETED", "PROCESSING", "WAITING", "FAILED"];
    const statusLabels: Record<AiProcessingStatus, string> = {
      COMPLETED: "Hoàn thành",
      PROCESSING: "Đang xử lý",
      WAITING: "Đang chờ",
      FAILED: "Thất bại",
    };
    const statusColors: Record<AiProcessingStatus, string> = {
      COMPLETED: "#2f7d53",
      PROCESSING: "#3b74c5",
      WAITING: "#d8f05f",
      FAILED: "#e76545",
    };
    const trend = Array.from({ length: range }, (_, index) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - (range - index - 1));
      const nextDay = new Date(dayStart.getTime() + 86_400_000);
      return {
        date: dayStart.toISOString(),
        label: format(dayStart, range === 7 ? "EEE" : "dd/MM", { locale: vi }),
        applications: applications.filter((item) => {
          const submitted = new Date(item.submittedAt);
          return submitted >= dayStart && submitted < nextDay;
        }).length,
      };
    });

    const pendingHr = users.filter((user) => user.verificationStatus === "PENDING").length;
    const pendingJobs = jobs.filter(
      (job) => job.status === "PENDING" && job.moderationState === "AWAITING",
    ).length;
    const failedAi = applications.filter((item) => item.aiStatus === "FAILED").length;
    const failedAiInRange = applicationsInRange.filter((item) => item.aiStatus === "FAILED").length;
    const aiCompletionRate = applicationsInRange.length
      ? Math.round((completedCount / applicationsInRange.length) * 100)
      : 0;

    return {
      range,
      generatedAt: new Date().toISOString(),
      hasData: true,
      metrics: [
        { id: "users", label: "Tổng người dùng", value: users.length, change: "+4 tháng này", href: "/admin/users" },
        { id: "pending-hr", label: "HR chờ xác minh", value: pendingHr, change: "Cần xử lý", href: "/admin/users?role=HR&verification=PENDING", emphasis: pendingHr > 0 },
        { id: "jobs", label: "Tin đang hiển thị", value: jobs.filter((job) => job.status === "PUBLISHED").length, change: `${pendingJobs} chờ duyệt`, href: "/admin/jobs?status=PENDING&moderation=AWAITING" },
        { id: "applications", label: `Ứng tuyển / ${range} ngày`, value: applicationsInRange.length, change: "Theo ngày nộp", href: "/admin/applications" },
        { id: "ai-rate", label: "AI hoàn thành", value: aiCompletionRate, suffix: "%", change: `${failedAiInRange} hồ sơ lỗi`, href: "/admin/applications?aiStatus=FAILED" },
      ],
      attention: [
        { id: "hr", label: "Xác minh nhà tuyển dụng", description: "Hồ sơ doanh nghiệp đang chờ quyết định", count: pendingHr, href: "/admin/users?role=HR&verification=PENDING", tone: "warning" },
        { id: "jobs", label: "Duyệt tin tuyển dụng", description: "Tin mới chưa được hiển thị công khai", count: pendingJobs, href: "/admin/jobs?status=PENDING&moderation=AWAITING", tone: "info" },
        { id: "ai", label: "Xử lý AI thất bại", description: "Hồ sơ cần kiểm tra hoặc chạy lại", count: failedAi, href: "/admin/applications?aiStatus=FAILED", tone: "danger" },
      ],
      aiStatuses: statusOrder.map((status) => ({
        status,
        label: statusLabels[status],
        value: applicationsInRange.filter((item) => item.aiStatus === status).length,
        color: statusColors[status],
      })),
      trend,
      recentActivities: activities.slice(0, 6),
    };
  }

  async getUsers(filters: UserFilters = {}): Promise<AdminUser[]> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") return [];
    const query = normalize(filters.search ?? "");
    const users = mockDatabase.snapshot().users.filter((user) => {
      const matchesQuery = !query || normalize(`${user.fullName} ${user.email}`).includes(query);
      const matchesRole = !filters.role || filters.role === "ALL" || user.role === filters.role;
      const matchesStatus = !filters.status || filters.status === "ALL" || user.status === filters.status;
      const matchesVerification =
        !filters.verificationStatus ||
        filters.verificationStatus === "ALL" ||
        user.verificationStatus === filters.verificationStatus;
      return matchesQuery && matchesRole && matchesStatus && matchesVerification;
    });
    return users;
  }

  async getUser(userId: string): Promise<AdminUser> {
    await delay(QUERY_DELAY);
    const user = mockDatabase.snapshot().users.find((item) => item.id === userId);
    if (!user) throw new MockApiError("Không tìm thấy người dùng.", "USER_NOT_FOUND");
    return user;
  }

  async getUserActivity(userId: string): Promise<ActivityEntry[]> {
    await delay(QUERY_DELAY);
    return mockDatabase.snapshot().activities.filter(
      (activity) => activity.targetHref === `/admin/users/${userId}`,
    );
  }

  async updateUserStatus(input: UserStatusInput): Promise<AdminUser> {
    await delay(MUTATION_DELAY);
    if (input.userId === CURRENT_ADMIN_ID && input.status === "BLOCKED") {
      throw new MockApiError("Không thể tự khóa tài khoản quản trị đang đăng nhập.", "SELF_BLOCK_FORBIDDEN");
    }
    const current = mockDatabase.findUser(input.userId);
    if (!current) throw new MockApiError("Không tìm thấy người dùng.", "USER_NOT_FOUND");
    const updated = mockDatabase.updateUser(input.userId, {
      status: input.status,
      blockReason: input.status === "BLOCKED" ? input.reason : undefined,
    });
    if (!updated) throw new MockApiError("Không thể cập nhật người dùng.");
    mockDatabase.addActivity(
      createActivity(
        "USER_STATUS_CHANGED",
        input.status === "BLOCKED" ? `đã khóa tài khoản · ${input.reason}` : `đã mở lại tài khoản · ${input.reason}`,
        updated,
      ),
    );
    return updated;
  }

  async updateHrVerification(input: VerificationInput): Promise<AdminUser> {
    await delay(MUTATION_DELAY);
    const current = mockDatabase.findUser(input.userId);
    if (!current) throw new MockApiError("Không tìm thấy người dùng.", "USER_NOT_FOUND");
    if (current.role !== "HR") throw new MockApiError("Chỉ tài khoản HR có hồ sơ xác minh.");
    const updated = mockDatabase.updateUser(input.userId, {
      verificationStatus: input.decision,
      verificationNote: input.note,
    });
    if (!updated) throw new MockApiError("Không thể cập nhật hồ sơ xác minh.");
    const actionLabels = {
      VERIFIED: "đã xác minh nhà tuyển dụng",
      CHANGES_REQUESTED: "đã yêu cầu bổ sung hồ sơ",
      REJECTED: "đã từ chối hồ sơ xác minh",
    } as const;
    mockDatabase.addActivity(
      createActivity("HR_VERIFICATION_CHANGED", `${actionLabels[input.decision]} · ${input.note}`, updated),
    );
    return updated;
  }

  getJobs(filters: JobFilters = {}) {
    return mockJobService.getJobs(filters);
  }

  getJob(jobId: string) {
    return mockJobService.getJob(jobId);
  }

  updateJob(input: JobActionInput) {
    return mockJobService.updateJob(input);
  }

  getApplications(filters: ApplicationFilters = {}) {
    return mockApplicationService.getApplications(filters);
  }

  getApplication(applicationId: string) {
    return mockApplicationService.getApplication(applicationId);
  }

  retryApplication(applicationId: string) {
    return mockApplicationService.retryApplication(applicationId);
  }

  async getActivities() {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") return [];
    return mockDatabase.snapshot().activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getKnowledge() { return mockKnowledgeService.getKnowledge(); }
  getCompetency(id: string) { return mockKnowledgeService.getCompetency(id); }
  saveJobFamily(input: JobFamilyInput) { return mockKnowledgeService.saveJobFamily(input); }
  saveCareerLevel(input: CareerLevelInput) { return mockKnowledgeService.saveCareerLevel(input); }
  saveCompetency(input: CompetencyInput) { return mockKnowledgeService.saveCompetency(input); }
  saveCompetencyLevels(id: string, levels: CompetencyLevel[]) { return mockKnowledgeService.saveCompetencyLevels(id, levels); }
  toggleKnowledge(input: ToggleKnowledgeInput) { return mockKnowledgeService.toggleKnowledge(input); }
}

export const mockAdminService = new MockAdminService();
