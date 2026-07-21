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
    ...application,
    candidateName: candidate.fullName,
    candidateEmail: candidate.email,
    jobTitle: job.title,
    companyName: job.companyName,
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
    candidate: { id: candidate.id, fullName: candidate.fullName, email: candidate.email },
    job: { id: job.id, title: job.title, companyName: job.companyName },
    pipeline: buildAiPipeline(application),
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
      const matchesRecruitment = !filters.recruitmentStatus || filters.recruitmentStatus === "ALL" || item.recruitmentStatus === filters.recruitmentStatus;
      const matchesAi = !filters.aiStatus || filters.aiStatus === "ALL" || item.aiStatus === filters.aiStatus;
      const matchesDate = !filters.dateRange || filters.dateRange === "ALL" || new Date(item.submittedAt).getTime() >= now - Number(filters.dateRange) * 86_400_000;
      const matchesScore = !filters.scoreBand || filters.scoreBand === "ALL"
        || (filters.scoreBand === "UNSCORED" && item.matchScore === undefined)
        || (filters.scoreBand === "HIGH" && (item.matchScore ?? -1) >= 80)
        || (filters.scoreBand === "MEDIUM" && (item.matchScore ?? -1) >= 65 && (item.matchScore ?? -1) < 80)
        || (filters.scoreBand === "LOW" && item.matchScore !== undefined && item.matchScore < 65);
      return matchesSearch && matchesRecruitment && matchesAi && matchesDate && matchesScore;
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
    return toDetail(updated);
  }
}

export const mockApplicationService = new MockApplicationService();
