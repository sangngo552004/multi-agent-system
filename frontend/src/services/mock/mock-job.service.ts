import type {
  JobActionInput,
  JobDetail,
  JobFilters,
  JobListItem,
  JobListResult,
} from "@/features/admin/jobs/jobs.types";
import { mockDatabase } from "@/mocks/mock-database";
import { getMockScenario } from "@/mocks/mock-scenarios";
import type { ActivityEntry, AdminJob, JobStatus } from "@/types/domain/admin";

const QUERY_DELAY = 360;
const MUTATION_DELAY = 560;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function getReadinessIssues(job: AdminJob) {
  const issues: string[] = [];
  if (!job.title.trim()) issues.push("Thiếu tiêu đề");
  if (!job.description.trim()) issues.push("Thiếu mô tả");
  if (!job.requirements.length) issues.push("Thiếu yêu cầu công việc");
  if (!job.jobFamilyId) issues.push("Chưa chọn nhóm nghề");
  if (!job.careerLevelId) issues.push("Chưa chọn cấp bậc");
  if (!job.competencies.length) issues.push("Chưa cấu hình năng lực");
  return issues;
}

function toListItem(job: AdminJob): JobListItem {
  const snapshot = mockDatabase.snapshot();
  const owner = snapshot.users.find((user) => user.id === job.ownerId);
  return {
    ...job,
    ownerName: owner?.fullName ?? "Không xác định",
    applicationCount: snapshot.applications.filter((item) => item.jobId === job.id).length,
    matchingReady: getReadinessIssues(job).length === 0,
  };
}

function toDetail(job: AdminJob): JobDetail {
  const snapshot = mockDatabase.snapshot();
  const owner = snapshot.users.find((user) => user.id === job.ownerId);
  if (!owner) throw new Error("Không tìm thấy nhà tuyển dụng của tin này.");
  const applications = snapshot.applications.filter((item) => item.jobId === job.id);
  const completedScores = applications
    .filter((item) => item.aiStatus === "COMPLETED" && item.matchScore !== undefined)
    .map((item) => item.matchScore as number);
  const readinessIssues = getReadinessIssues(job);

  return {
    ...job,
    ownerName: owner.fullName,
    owner: {
      id: owner.id,
      fullName: owner.fullName,
      email: owner.email,
      verificationStatus: owner.verificationStatus,
    },
    applicationCount: applications.length,
    aiCompletedCount: applications.filter((item) => item.aiStatus === "COMPLETED").length,
    aiFailedCount: applications.filter((item) => item.aiStatus === "FAILED").length,
    averageMatchScore: completedScores.length
      ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length)
      : undefined,
    matchingReady: readinessIssues.length === 0,
    readinessIssues,
  };
}

function addJobActivity(job: AdminJob, kind: ActivityEntry["kind"], description: string) {
  mockDatabase.addActivity({
    id: `act-job-${Date.now()}`,
    kind,
    actorName: "Admin Nguyễn",
    description,
    targetLabel: job.title,
    targetHref: `/admin/jobs/${job.id}`,
    createdAt: new Date().toISOString(),
  });
}

class MockJobService {
  async getJobs(filters: JobFilters = {}): Promise<JobListResult> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") {
      return { items: [], statusCounts: { PENDING: 0, PUBLISHED: 0, HIDDEN: 0, CLOSED: 0 } };
    }

    const query = normalize(filters.search ?? "");
    const baseItems = mockDatabase.snapshot().jobs.map(toListItem).filter((job) => {
      const matchesSearch =
        !query || normalize(`${job.title} ${job.companyName} ${job.ownerName}`).includes(query);
      const matchesFamily =
        !filters.jobFamilyId ||
        filters.jobFamilyId === "ALL" ||
        job.jobFamilyId === filters.jobFamilyId;
      const matchesLevel =
        !filters.careerLevelId ||
        filters.careerLevelId === "ALL" ||
        job.careerLevelId === filters.careerLevelId;
      const matchesModeration =
        !filters.moderationState ||
        filters.moderationState === "ALL" ||
        job.moderationState === filters.moderationState;
      return matchesSearch && matchesFamily && matchesLevel && matchesModeration;
    });
    const statuses: JobStatus[] = ["PENDING", "PUBLISHED", "HIDDEN", "CLOSED"];
    const statusCounts = Object.fromEntries(
      statuses.map((status) => [status, baseItems.filter((job) => job.status === status).length]),
    ) as Record<JobStatus, number>;
    const items = baseItems.filter(
      (job) => !filters.status || filters.status === "ALL" || job.status === filters.status,
    );
    return { items, statusCounts };
  }

  async getJob(jobId: string): Promise<JobDetail> {
    await delay(QUERY_DELAY);
    const job = mockDatabase.snapshot().jobs.find((item) => item.id === jobId);
    if (!job) throw new Error("Không tìm thấy tin tuyển dụng.");
    return toDetail(job);
  }

  async updateJob(input: JobActionInput): Promise<JobDetail> {
    await delay(MUTATION_DELAY);
    const current = mockDatabase.findJob(input.jobId);
    if (!current) throw new Error("Không tìm thấy tin tuyển dụng.");
    const reviewedAt = new Date().toISOString();
    let updated: AdminJob | undefined;

    if (input.action === "APPROVE") {
      if (current.status !== "PENDING" || current.moderationState !== "AWAITING") throw new Error("Chỉ tin đang chờ kiểm duyệt mới có thể được duyệt.");
      const issues = getReadinessIssues(current);
      if (issues.length) throw new Error(`Chưa thể duyệt: ${issues.join(", ")}.`);
      updated = mockDatabase.updateJob(current.id, {
        status: "PUBLISHED",
        moderationState: "APPROVED",
        rejectionReason: undefined,
        reviewedAt,
      });
      if (updated) addJobActivity(updated, "JOB_MODERATION_CHANGED", "đã duyệt và đăng tin");
    }

    if (input.action === "REJECT") {
      if (current.status !== "PENDING" || current.moderationState !== "AWAITING") throw new Error("Chỉ tin đang chờ kiểm duyệt mới có thể được trả về HR.");
      if (!input.reason || input.reason.trim().length < 8) throw new Error("Lý do từ chối cần có ít nhất 8 ký tự.");
      updated = mockDatabase.updateJob(current.id, {
        status: "PENDING",
        moderationState: "REJECTED",
        rejectionReason: input.reason.trim(),
        reviewedAt,
      });
      if (updated) addJobActivity(updated, "JOB_MODERATION_CHANGED", `đã trả tin về HR · ${input.reason.trim()}`);
    }

    if (input.action === "HIDE") {
      if (current.status !== "PUBLISHED") throw new Error("Chỉ tin đang hiển thị mới có thể được ẩn.");
      updated = mockDatabase.updateJob(current.id, { status: "HIDDEN", reviewedAt });
      if (updated) addJobActivity(updated, "JOB_STATUS_CHANGED", "đã ẩn tin khỏi ứng viên");
    }

    if (input.action === "REPUBLISH") {
      if (current.status !== "HIDDEN") throw new Error("Chỉ tin đã ẩn mới có thể hiển thị lại.");
      updated = mockDatabase.updateJob(current.id, { status: "PUBLISHED", reviewedAt });
      if (updated) addJobActivity(updated, "JOB_STATUS_CHANGED", "đã hiển thị lại tin");
    }

    if (!updated) throw new Error("Thao tác không hợp lệ với trạng thái hiện tại.");
    return toDetail(updated);
  }
}

export const mockJobService = new MockJobService();
