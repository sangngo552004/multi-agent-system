import type {
  ApplicationDetail,
  ApplicationFilters,
  ApplicationListItem,
} from "@/features/admin/applications/applications.types";
import { buildAiPipeline } from "@/features/admin/applications/application-pipeline";
import { mockDatabase } from "@/mocks/mock-database";
import { getMockScenario } from "@/mocks/mock-scenarios";
import type { ActivityEntry, AdminApplication } from "@/types/domain/admin";

const QUERY_DELAY = 360;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function toListItem(application: AdminApplication): ApplicationListItem {
  const snapshot = mockDatabase.snapshot();
  const candidate = snapshot.users.find((user) => user.id === application.candidateId);
  const job = snapshot.jobs.find((item) => item.id === application.jobId);
  if (!candidate || !job) throw new Error("Dữ liệu hồ sơ không còn liên kết hợp lệ.");
  return {
    id: application.id,
    candidateId: application.candidateId,
    jobId: application.jobId,
    aiStatus: application.aiStatus,
    submittedAt: application.submittedAt,
    aiConfidence: application.aiConfidence,
    needsReview: application.needsReview,
    extractionMethod: application.extractionMethod,
    errorCode: application.errorCode,
    errorMessage: application.errorMessage,
    canRetry: application.canRetry,
    candidateName: candidate.fullName,
    jobTitle: job.title,
    departmentName: job.departmentName,
  };
}

function toDetail(application: AdminApplication): ApplicationDetail {
  const item = toListItem(application);
  const snapshot = mockDatabase.snapshot();
  const candidate = snapshot.users.find((user) => user.id === application.candidateId);
  const job = snapshot.jobs.find((entry) => entry.id === application.jobId);
  if (!candidate || !job) throw new Error("Dữ liệu hồ sơ không còn liên kết hợp lệ.");
  return {
    ...item,
    candidate: { id: candidate.id, fullName: candidate.fullName },
    job: { id: job.id, title: job.title, departmentName: job.departmentName },
    pipeline: buildAiPipeline(application),
    warningCount: application.extractionWarnings.length,
  };
}

class MockApplicationService {
  async getApplications(filters: ApplicationFilters = {}): Promise<ApplicationListItem[]> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") return [];
    const query = normalize(filters.search ?? "");
    const now = Date.now();

    return mockDatabase.snapshot().applications.map(toListItem).filter((item) => {
      const matchesSearch = !query || normalize(`${item.id} ${item.candidateName} ${item.jobTitle}`).includes(query);
      const matchesAi = !filters.aiStatus || filters.aiStatus === "ALL" || item.aiStatus === filters.aiStatus;
      const matchesDate = !filters.dateRange || filters.dateRange === "ALL" || new Date(item.submittedAt).getTime() >= now - Number(filters.dateRange) * 86_400_000;
      return matchesSearch && matchesAi && matchesDate;
    });
  }

  async getApplication(applicationId: string): Promise<ApplicationDetail> {
    await delay(QUERY_DELAY);
    const application = mockDatabase.snapshot().applications.find((item) => item.id === applicationId);
    if (!application) throw new Error("Không tìm thấy hồ sơ ứng tuyển.");
    return toDetail(application);
  }

  async retryApplication(applicationId: string): Promise<ApplicationDetail> {
    const current = mockDatabase.findApplication(applicationId);
    if (!current) throw new Error("Không tìm thấy hồ sơ ứng tuyển.");
    if (current.aiStatus !== "FAILED" || !current.canRetry) throw new Error("Hồ sơ này không thể chạy lại tự động.");

    mockDatabase.updateApplication(applicationId, { aiStatus: "WAITING", errorCode: undefined, errorMessage: undefined, canRetry: false });
    await delay(650);
    mockDatabase.updateApplication(applicationId, { aiStatus: "PROCESSING" });
    await delay(850);
    const updated = mockDatabase.updateApplication(applicationId, {
      aiStatus: "COMPLETED",
      matchScore: 78,
      aiConfidence: 0.92,
      needsReview: false,
      canRetry: false,
      scoreBreakdown: { hardSkills: 82, softSkills: 74, experience: 76 },
      aiRecommendation: "Hồ sơ phù hợp tốt sau khi xử lý lại. Nên chuyển sang vòng đánh giá chuyên môn.",
      careerPath: [
        { title: "Củng cố nền tảng", duration: "0–3 tháng", objective: "Hoàn thiện các năng lực còn thiếu.", activities: ["Học kiểm thử tự động", "Thực hành thiết kế module"] },
        { title: "Mở rộng phạm vi", duration: "3–6 tháng", objective: "Sở hữu tính năng hoàn chỉnh.", activities: ["Dẫn dắt một tính năng", "Thực hiện code review"] },
      ],
    });
    if (!updated) throw new Error("Không thể cập nhật hồ sơ.");
    const activity: ActivityEntry = {
      id: `act-retry-${Date.now()}`,
      kind: "AI_RETRY_COMPLETED",
      actorName: "Admin Nguyễn",
      description: "đã chạy lại quy trình AI thành công",
      targetLabel: updated.id.toUpperCase(),
      targetHref: `/admin/applications/${updated.id}`,
      createdAt: new Date().toISOString(),
    };
    mockDatabase.addActivity(activity);
    const sourceJob = mockDatabase.findJob(updated.jobId);
    const owner = sourceJob ? mockDatabase.findUser(sourceJob.ownerId) : undefined;
    if (sourceJob && owner?.role === "HR") {
      mockDatabase.addHrNotification({
        id: `hr-notification-resolved-${Date.now()}`,
        hrId: sourceJob.ownerId,
        kind: "ADMIN_RESOLVED",
        title: "Lỗi AI đã được xử lý",
        description: `Kết quả đối sánh cho ${updated.id.toUpperCase()} đã sẵn sàng để kiểm tra.`,
        href: `/hr/applications/${updated.id}`,
        createdAt: new Date().toISOString(),
      });
    }
    return toDetail(updated);
  }
}

export const mockApplicationService = new MockApplicationService();
