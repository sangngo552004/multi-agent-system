import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  HrDashboardData,
  HrDashboardRange,
} from "@/features/hr/dashboard/dashboard.types";
import type {
  ChangeHrJobStatusInput,
  HrJobDetail,
  HrJobFilters,
  HrJobListItem,
  HrJobListResult,
  SaveHrJobInput,
} from "@/features/hr/jobs/jobs.types";
import type {
  AddHrApplicationNoteInput,
  CompetencyEvidence,
  HrApplicationDetail,
  HrApplicationFilters,
  HrApplicationListItem,
  UpdateHrApplicationStatusInput,
} from "@/features/hr/applications/applications.types";
import type {
  SaveTalentPoolInput,
  TalentPoolFilters,
  TalentPoolListItem,
  UpdateTalentPoolInput,
} from "@/features/hr/talent-pool/talent-pool.types";
import { CURRENT_HR_ID } from "@/lib/constants";
import { getJobReadinessIssues } from "@/lib/job-readiness";
import { mockDatabase, type MockDatabaseState } from "@/mocks/mock-database";
import { getMockScenario } from "@/mocks/mock-scenarios";
import type { HrService } from "@/services/contracts/hr-service";
import type {
  ActivityEntry,
} from "@/types/domain/admin";
import type {
  JobStatus,
  RecruitmentApplication,
  RecruitmentJob,
  RecruitmentStatus,
} from "@/types/domain/recruitment";

const QUERY_DELAY = 320;
const MUTATION_DELAY = 520;
const DAY = 86_400_000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function createHrActivity(
  kind: ActivityEntry["kind"],
  actorName: string,
  description: string,
  job: RecruitmentJob,
): ActivityEntry {
  return {
    id: `act-hr-${Date.now()}-${job.id}`,
    kind,
    actorName,
    description,
    targetLabel: job.title,
    targetHref: `/admin/jobs/${job.id}`,
    createdAt: new Date().toISOString(),
  };
}

function assertPublishable(job: RecruitmentJob) {
  const issues = getJobReadinessIssues(job);
  if (issues.length) {
    throw new MockHrApiError(`Tin chưa sẵn sàng: ${issues.join(", ")}.`, "HR_JOB_NOT_READY");
  }
  if (new Date(job.expiresAt).getTime() <= Date.now()) {
    throw new MockHrApiError("Hạn nhận hồ sơ phải ở tương lai khi mở tuyển.", "HR_JOB_EXPIRED");
  }
}

function applicationUpdatedAt(snapshot: MockDatabaseState, application: RecruitmentApplication) {
  return snapshot.applicationHistories
    .filter((entry) => entry.applicationId === application.id)
    .reduce((latest, entry) => new Date(entry.createdAt).getTime() > new Date(latest).getTime() ? entry.createdAt : latest, application.submittedAt);
}

function toApplicationListItem(snapshot: MockDatabaseState, application: RecruitmentApplication): HrApplicationListItem {
  const candidate = snapshot.users.find((user) => user.id === application.candidateId);
  const job = snapshot.jobs.find((item) => item.id === application.jobId);
  if (!candidate || !job) throw new MockHrApiError("Dữ liệu hồ sơ không còn liên kết hợp lệ.", "HR_APPLICATION_DATA_INVALID");
  return {
    id: application.id,
    candidateId: application.candidateId,
    jobId: application.jobId,
    recruitmentStatus: application.recruitmentStatus,
    aiStatus: application.aiStatus,
    submittedAt: application.submittedAt,
    matchScore: application.matchScore,
    aiConfidence: application.aiConfidence,
    needsReview: application.needsReview,
    extractionWarnings: application.extractionWarnings,
    candidateName: candidate.fullName,
    candidateEmail: candidate.email,
    jobTitle: job.title,
    departmentName: job.departmentName,
    updatedAt: applicationUpdatedAt(snapshot, application),
  };
}

function buildCompetencyEvidence(application: RecruitmentApplication, job: RecruitmentJob): CompetencyEvidence[] {
  return job.competencies.map((requirement, index) => {
    const score = application.matchScore ?? 0;
    const supported = application.aiStatus === "COMPLETED" && score >= 72 - index * 3;
    const partial = application.aiStatus === "COMPLETED" && !supported && score >= 55;
    const detected = application.matchedSkills[index % Math.max(1, application.matchedSkills.length)];
    return {
      ...requirement,
      evidenceStatus: supported ? "SUPPORTED" : partial ? "PARTIAL" : "NOT_FOUND",
      confidence: application.aiConfidence < 0.75 ? "LOW" : supported ? "HIGH" : "MEDIUM",
      evidence: supported
        ? `CV thể hiện kinh nghiệm liên quan qua ${detected ?? "các dự án đã mô tả"}. HR nên đối chiếu phạm vi công việc trong CV gốc.`
        : partial
          ? "CV có tín hiệu liên quan nhưng chưa đủ chi tiết để xác nhận mức năng lực yêu cầu."
          : "CV chưa cung cấp đủ bằng chứng rõ ràng cho năng lực này; đây không phải kết luận ứng viên không có năng lực.",
    };
  });
}

function toTalentPoolListItem(snapshot: MockDatabaseState, entry: MockDatabaseState["talentPoolEntries"][number]): TalentPoolListItem {
  const candidate = snapshot.users.find((item) => item.id === entry.candidateId);
  const application = snapshot.applications.find((item) => item.id === entry.applicationId);
  const job = application ? snapshot.jobs.find((item) => item.id === application.jobId) : undefined;
  if (!candidate || !application || !job) throw new MockHrApiError("Dữ liệu ứng viên tiềm năng không còn liên kết hợp lệ.", "HR_TALENT_DATA_INVALID");
  return {
    ...structuredClone(entry),
    candidateName: candidate.fullName,
    candidateEmail: candidate.email,
    previousJobTitle: job.title,
    jobFamilyName: job.jobFamilyName,
    careerLevelName: job.careerLevelName,
    skills: [...new Set(application.skillGroups.flatMap((group) => group.skills))],
    matchScore: application.matchScore,
    expired: new Date(entry.retentionUntil).getTime() < Date.now(),
  };
}

export class MockHrApiError extends Error {
  constructor(message: string, public code = "HR_MOCK_API_ERROR") {
    super(message);
    this.name = "MockHrApiError";
  }
}

function getCurrentHrFromSnapshot(snapshot: MockDatabaseState) {
  const user = snapshot.users.find((item) => item.id === CURRENT_HR_ID);
  if (!user || user.role !== "HR") {
    throw new MockHrApiError("Không tìm thấy tài khoản HR đang đăng nhập.", "HR_SESSION_NOT_FOUND");
  }
  if (user.status !== "ACTIVE") {
    throw new MockHrApiError("Tài khoản HR đang bị khóa.", "HR_ACCOUNT_BLOCKED");
  }
  return user;
}

function ownedData(snapshot: MockDatabaseState) {
  getCurrentHrFromSnapshot(snapshot);
  const jobs = snapshot.jobs.filter((job) => job.ownerId === CURRENT_HR_ID);
  const jobIds = new Set(jobs.map((job) => job.id));
  const applications = snapshot.applications.filter((item) => jobIds.has(item.jobId));
  return { jobs, applications };
}

function deadlineState(job: RecruitmentJob) {
  const remaining = new Date(job.expiresAt).getTime() - Date.now();
  return {
    expired: remaining < 0,
    expiresSoon: remaining >= 0 && remaining <= 7 * DAY,
  };
}

function toListItem(
  job: RecruitmentJob,
  applications: RecruitmentApplication[],
): HrJobListItem {
  const jobApplications = applications.filter((item) => item.jobId === job.id);
  const sevenDaysAgo = Date.now() - 7 * DAY;
  return {
    ...job,
    applicationCount: jobApplications.length,
    newApplicationCount: jobApplications.filter(
      (item) => item.recruitmentStatus === "PENDING" && new Date(item.submittedAt).getTime() >= sevenDaysAgo,
    ).length,
    matchingReady: getJobReadinessIssues(job).length === 0,
    ...deadlineState(job),
  };
}

function emptyDashboard(range: HrDashboardRange): HrDashboardData {
  return {
    range,
    generatedAt: new Date().toISOString(),
    hasData: false,
    metrics: [],
    attention: [],
    trend: [],
    funnel: [],
    activeJobs: [],
  };
}

class MockHrService implements HrService {
  async getCurrentHr() {
    await delay(120);
    return structuredClone(getCurrentHrFromSnapshot(mockDatabase.snapshot()));
  }

  async getDashboard(range: HrDashboardRange): Promise<HrDashboardData> {
    await delay(QUERY_DELAY);
    const scenario = getMockScenario();
    if (scenario === "empty") return emptyDashboard(range);
    if (scenario === "ai-error") {
      throw new MockHrApiError(
        "Không thể tổng hợp kết quả AI lúc này. Danh sách tin vẫn có thể sử dụng.",
        "HR_AI_SUMMARY_UNAVAILABLE",
      );
    }

    const snapshot = mockDatabase.snapshot();
    const { jobs, applications } = ownedData(snapshot);
    const rangeStart = Date.now() - range * DAY;
    const applicationsInRange = applications.filter(
      (item) => new Date(item.submittedAt).getTime() >= rangeStart,
    );
    const openJobs = jobs.filter((job) => job.status === "OPEN" && !deadlineState(job).expired);
    const incompleteJobs = jobs.filter(
      (job) => job.status !== "CLOSED" && getJobReadinessIssues(job).length > 0,
    );
    const expiringJobs = openJobs.filter((job) => deadlineState(job).expiresSoon);
    const pendingApplications = applications.filter((item) => item.recruitmentStatus === "PENDING");
    const reviewingApplications = applications.filter((item) => item.recruitmentStatus === "REVIEWING");
    const shortlistedApplications = applications.filter((item) => item.recruitmentStatus === "SHORTLISTED");
    const lowConfidenceApplications = applications.filter(
      (item) => item.aiStatus === "COMPLETED" && (item.aiConfidence < 0.75 || item.extractionWarnings.length > 0),
    );
    const failedAi = applications.filter((item) => item.aiStatus === "FAILED");

    const trend = Array.from({ length: range }, (_, index) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - (range - index - 1));
      const nextDay = new Date(dayStart.getTime() + DAY);
      return {
        date: dayStart.toISOString(),
        label: format(dayStart, range === 7 ? "EEE" : "dd/MM", { locale: vi }),
        applications: applications.filter((item) => {
          const submittedAt = new Date(item.submittedAt);
          return submittedAt >= dayStart && submittedAt < nextDay;
        }).length,
      };
    });

    const funnelOrder: RecruitmentStatus[] = ["PENDING", "REVIEWING", "SHORTLISTED", "HIRED", "REJECTED"];
    const funnelLabels: Record<RecruitmentStatus, string> = {
      PENDING: "Mới nhận",
      REVIEWING: "Đang xem",
      SHORTLISTED: "Danh sách ngắn",
      HIRED: "Đã tuyển",
      REJECTED: "Không phù hợp",
    };
    const funnelColors: Record<RecruitmentStatus, string> = {
      PENDING: "#aab4ad",
      REVIEWING: "#3b74c5",
      SHORTLISTED: "#d8f05f",
      HIRED: "#2f7d53",
      REJECTED: "#e76545",
    };

    return {
      range,
      generatedAt: new Date().toISOString(),
      hasData: jobs.length > 0 || applications.length > 0,
      metrics: [
        { id: "open-jobs", label: "Vị trí đang tuyển", value: openJobs.length, note: `${jobs.length} tin đang phụ trách`, href: "/hr/jobs?status=OPEN" },
        { id: "new-applications", label: `Hồ sơ mới / ${range} ngày`, value: applicationsInRange.filter((item) => item.recruitmentStatus === "PENDING").length, note: "Theo ngày ứng tuyển", href: "/hr/applications?status=PENDING" },
        { id: "pending-review", label: "Đang chờ xem xét", value: pendingApplications.length + reviewingApplications.length, note: `${reviewingApplications.length} hồ sơ đã mở`, href: "/hr/applications?status=REVIEWING", emphasis: pendingApplications.length > 0 },
        { id: "shortlisted", label: "Danh sách ngắn", value: shortlistedApplications.length, note: "Đang tiếp tục trao đổi", href: "/hr/applications?status=SHORTLISTED" },
        { id: "expiring-jobs", label: "Tin sắp hết hạn", value: expiringJobs.length, note: "Trong 7 ngày tới", href: "/hr/jobs?deadline=EXPIRING", emphasis: expiringJobs.length > 0 },
      ],
      attention: [
        { id: "incomplete-jobs", label: "Tin cần hoàn thiện", description: "Thiếu dữ liệu để AI đối sánh", count: incompleteJobs.length, href: "/hr/jobs?readiness=INCOMPLETE", tone: "warning" },
        { id: "pending-applications", label: "Hồ sơ mới chưa xem", description: "Ứng viên đang chờ HR phản hồi", count: pendingApplications.length, href: "/hr/applications?status=PENDING", tone: "info" },
        { id: "low-confidence", label: "Cần đối chiếu CV", description: "Dữ liệu AI có độ tin cậy thấp", count: lowConfidenceApplications.length, href: "/hr/applications?review=REQUIRED", tone: "warning" },
        { id: "ai-failed", label: "Xử lý AI thất bại", description: "Đã chuyển sang hàng đợi hỗ trợ", count: failedAi.length, href: "/hr/applications?aiStatus=FAILED", tone: "danger" },
      ],
      trend,
      funnel: funnelOrder.map((status) => ({
        status,
        label: funnelLabels[status],
        value: applications.filter((item) => item.recruitmentStatus === status).length,
        color: funnelColors[status],
      })),
      activeJobs: jobs
        .filter((job) => job.status !== "CLOSED")
        .map((job) => toListItem(job, applications))
        .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
        .slice(0, 5)
        .map((job) => ({
          id: job.id,
          title: job.title,
          status: job.status,
          applicationCount: job.applicationCount,
          newApplicationCount: job.newApplicationCount,
          expiresAt: job.expiresAt,
          matchingReady: job.matchingReady,
        })),
    };
  }

  async getCatalogOptions() {
    await delay(180);
    const snapshot = mockDatabase.snapshot();
    return {
      jobFamilies: snapshot.jobFamilies.filter((item) => item.status === "ACTIVE").map(({ id, name }) => ({ id, name })),
      careerLevels: snapshot.careerLevels.filter((item) => item.status === "ACTIVE").map(({ id, name }) => ({ id, name })),
      competencies: snapshot.competencies.filter((item) => item.status === "ACTIVE").map(({ id, name, category }) => ({ id, name, category })),
    };
  }

  async getJobs(filters: HrJobFilters = {}): Promise<HrJobListResult> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") {
      return { items: [], statusCounts: { DRAFT: 0, OPEN: 0, PAUSED: 0, CLOSED: 0 } };
    }

    const snapshot = mockDatabase.snapshot();
    const { jobs, applications } = ownedData(snapshot);
    const query = normalize(filters.search ?? "");
    const baseItems = jobs.map((job) => toListItem(job, applications)).filter((job) => {
      const matchesSearch = !query || normalize(`${job.title} ${job.departmentName}`).includes(query);
      const matchesFamily = !filters.jobFamilyId || filters.jobFamilyId === "ALL" || job.jobFamilyId === filters.jobFamilyId;
      const matchesLevel = !filters.careerLevelId || filters.careerLevelId === "ALL" || job.careerLevelId === filters.careerLevelId;
      const matchesReadiness = !filters.readiness || filters.readiness === "ALL"
        || (filters.readiness === "READY" && job.matchingReady)
        || (filters.readiness === "INCOMPLETE" && !job.matchingReady);
      const matchesDeadline = !filters.deadline || filters.deadline === "ALL"
        || (filters.deadline === "EXPIRING" && job.expiresSoon)
        || (filters.deadline === "EXPIRED" && job.expired);
      return matchesSearch && matchesFamily && matchesLevel && matchesReadiness && matchesDeadline;
    });

    const statuses: JobStatus[] = ["DRAFT", "OPEN", "PAUSED", "CLOSED"];
    const statusCounts = Object.fromEntries(
      statuses.map((status) => [status, baseItems.filter((job) => job.status === status).length]),
    ) as Record<JobStatus, number>;
    const items = baseItems
      .filter((job) => !filters.status || filters.status === "ALL" || job.status === filters.status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { items, statusCounts };
  }

  async getJob(jobId: string): Promise<HrJobDetail> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") {
      throw new MockHrApiError("Kịch bản hiện tại không có tin tuyển dụng.", "HR_JOB_NOT_FOUND");
    }
    const snapshot = mockDatabase.snapshot();
    getCurrentHrFromSnapshot(snapshot);
    const job = snapshot.jobs.find((item) => item.id === jobId);
    if (!job) throw new MockHrApiError("Không tìm thấy tin tuyển dụng.", "HR_JOB_NOT_FOUND");
    if (job.ownerId !== CURRENT_HR_ID) {
      throw new MockHrApiError("Bạn không có quyền xem tin tuyển dụng này.", "HR_JOB_FORBIDDEN");
    }

    const jobApplications = snapshot.applications.filter((item) => item.jobId === job.id);
    const listItem = toListItem(job, jobApplications);
    const pipelineStatuses: RecruitmentStatus[] = ["PENDING", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"];
    const pipelineCounts = Object.fromEntries(
      pipelineStatuses.map((status) => [status, jobApplications.filter((item) => item.recruitmentStatus === status).length]),
    ) as Record<RecruitmentStatus, number>;

    return {
      ...listItem,
      readinessIssues: getJobReadinessIssues(job),
      pipelineCounts,
      aiCompletedCount: jobApplications.filter((item) => item.aiStatus === "COMPLETED").length,
      aiFailedCount: jobApplications.filter((item) => item.aiStatus === "FAILED").length,
      recentApplications: jobApplications
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5)
        .map((application) => {
          const candidate = snapshot.users.find((user) => user.id === application.candidateId);
          return {
            id: application.id,
            candidateName: candidate?.fullName ?? "Ứng viên",
            candidateEmail: candidate?.email ?? "Không có email",
            recruitmentStatus: application.recruitmentStatus,
            aiStatus: application.aiStatus,
            matchScore: application.matchScore,
            submittedAt: application.submittedAt,
          };
        }),
    };
  }

  async saveJob(input: SaveHrJobInput): Promise<HrJobDetail> {
    await delay(MUTATION_DELAY);
    const snapshot = mockDatabase.snapshot();
    const actor = getCurrentHrFromSnapshot(snapshot);
    const family = snapshot.jobFamilies.find((item) => item.id === input.values.jobFamilyId);
    const level = snapshot.careerLevels.find((item) => item.id === input.values.careerLevelId);
    const base = {
      title: input.values.title.trim(),
      departmentName: input.values.departmentName.trim(),
      ownerId: CURRENT_HR_ID,
      location: input.values.location.trim(),
      employmentType: input.values.employmentType,
      openingsCount: input.values.openingsCount,
      description: input.values.description.trim(),
      requirements: splitLines(input.values.requirementsText),
      benefits: splitLines(input.values.benefitsText),
      jobFamilyId: input.values.jobFamilyId || undefined,
      jobFamilyName: family?.name,
      careerLevelId: input.values.careerLevelId || undefined,
      careerLevelName: level?.name,
      competencies: structuredClone(input.values.competencies),
      expiresAt: new Date(`${input.values.expiresAt}T23:59:59`).toISOString(),
    };

    if (!input.jobId) {
      const job: RecruitmentJob = {
        id: `job-${Date.now()}`,
        ...base,
        status: input.publish ? "OPEN" : "DRAFT",
        createdAt: new Date().toISOString(),
      };
      if (input.publish) assertPublishable(job);
      mockDatabase.addJob(job);
      mockDatabase.addActivity(createHrActivity("JOB_UPDATED", actor.fullName, input.publish ? "đã tạo và mở tuyển" : "đã tạo bản nháp", job));
      return this.getJob(job.id);
    }

    const current = snapshot.jobs.find((item) => item.id === input.jobId);
    if (!current) throw new MockHrApiError("Không tìm thấy tin tuyển dụng.", "HR_JOB_NOT_FOUND");
    if (current.ownerId !== CURRENT_HR_ID) throw new MockHrApiError("Bạn không có quyền sửa tin này.", "HR_JOB_FORBIDDEN");
    if (current.status === "CLOSED") throw new MockHrApiError("Tin đã đóng chỉ có thể xem hoặc nhân bản.", "HR_JOB_CLOSED");

    const patch = current.status === "DRAFT"
      ? base
      : {
          description: base.description,
          requirements: base.requirements,
          benefits: base.benefits,
          expiresAt: base.expiresAt,
        };
    const candidate = { ...current, ...patch, status: input.publish ? "OPEN" as const : current.status };
    if (input.publish) assertPublishable(candidate);
    const updated = mockDatabase.updateJob(current.id, patch);
    if (!updated) throw new MockHrApiError("Không thể cập nhật tin tuyển dụng.");
    if (input.publish && current.status === "DRAFT") mockDatabase.updateJob(current.id, { status: "OPEN" });
    mockDatabase.addActivity(createHrActivity(input.publish ? "JOB_STATUS_CHANGED" : "JOB_UPDATED", actor.fullName, input.publish ? "đã mở tuyển" : "đã cập nhật tin", candidate));
    return this.getJob(current.id);
  }

  async changeJobStatus(input: ChangeHrJobStatusInput): Promise<HrJobDetail> {
    await delay(MUTATION_DELAY);
    const snapshot = mockDatabase.snapshot();
    const actor = getCurrentHrFromSnapshot(snapshot);
    const current = snapshot.jobs.find((item) => item.id === input.jobId);
    if (!current) throw new MockHrApiError("Không tìm thấy tin tuyển dụng.", "HR_JOB_NOT_FOUND");
    if (current.ownerId !== CURRENT_HR_ID) throw new MockHrApiError("Bạn không có quyền thay đổi tin này.", "HR_JOB_FORBIDDEN");
    const allowed: Record<JobStatus, JobStatus[]> = {
      DRAFT: ["OPEN"],
      OPEN: ["PAUSED", "CLOSED"],
      PAUSED: ["OPEN", "CLOSED"],
      CLOSED: [],
    };
    if (!allowed[current.status].includes(input.status)) {
      throw new MockHrApiError("Chuyển trạng thái tin không hợp lệ.", "HR_JOB_STATUS_INVALID");
    }
    if (input.status === "OPEN") assertPublishable(current);
    const updated = mockDatabase.updateJob(current.id, { status: input.status });
    if (!updated) throw new MockHrApiError("Không thể cập nhật trạng thái tin.");
    const labels: Record<JobStatus, string> = { DRAFT: "bản nháp", OPEN: "đang tuyển", PAUSED: "tạm dừng", CLOSED: "đã đóng" };
    mockDatabase.addActivity(createHrActivity("JOB_STATUS_CHANGED", actor.fullName, `đã chuyển trạng thái sang ${labels[input.status]}`, updated));
    return this.getJob(current.id);
  }

  async duplicateJob(jobId: string): Promise<HrJobDetail> {
    await delay(MUTATION_DELAY);
    const snapshot = mockDatabase.snapshot();
    const actor = getCurrentHrFromSnapshot(snapshot);
    const current = snapshot.jobs.find((item) => item.id === jobId);
    if (!current) throw new MockHrApiError("Không tìm thấy tin tuyển dụng.", "HR_JOB_NOT_FOUND");
    if (current.ownerId !== CURRENT_HR_ID) throw new MockHrApiError("Bạn không có quyền nhân bản tin này.", "HR_JOB_FORBIDDEN");
    if (current.status !== "CLOSED") throw new MockHrApiError("Chỉ nhân bản tin đã đóng trong phiên bản demo.", "HR_JOB_DUPLICATE_INVALID");
    const duplicate: RecruitmentJob = {
      ...structuredClone(current),
      id: `job-${Date.now()}`,
      title: `${current.title} · Bản sao`,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * DAY).toISOString(),
    };
    mockDatabase.addJob(duplicate);
    mockDatabase.addActivity(createHrActivity("JOB_UPDATED", actor.fullName, "đã nhân bản thành tin nháp", duplicate));
    return this.getJob(duplicate.id);
  }

  async getApplications(filters: HrApplicationFilters = {}): Promise<HrApplicationListItem[]> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") return [];
    const snapshot = mockDatabase.snapshot();
    const { applications } = ownedData(snapshot);
    const query = normalize(filters.search ?? "");
    const fromDate = filters.dateRange && filters.dateRange !== "ALL" ? Date.now() - Number(filters.dateRange) * DAY : 0;
    const items = applications.map((application) => toApplicationListItem(snapshot, application)).filter((item) => {
      const matchesSearch = !query || normalize(`${item.candidateName} ${item.candidateEmail} ${item.jobTitle}`).includes(query);
      const matchesJob = !filters.jobId || filters.jobId === "ALL" || item.jobId === filters.jobId;
      const matchesStatus = !filters.recruitmentStatus || filters.recruitmentStatus === "ALL" || item.recruitmentStatus === filters.recruitmentStatus;
      const matchesAi = !filters.aiStatus || filters.aiStatus === "ALL" || item.aiStatus === filters.aiStatus;
      const matchesDate = !fromDate || new Date(item.submittedAt).getTime() >= fromDate;
      const matchesReview = !filters.review || filters.review === "ALL" || item.needsReview || item.aiConfidence < 0.75;
      return matchesSearch && matchesJob && matchesStatus && matchesAi && matchesDate && matchesReview;
    });
    return items.sort((a, b) => {
      if (filters.sort === "SCORE_DESC") return (b.matchScore ?? -1) - (a.matchScore ?? -1);
      const field = filters.sort === "UPDATED_DESC" ? "updatedAt" : "submittedAt";
      return new Date(b[field]).getTime() - new Date(a[field]).getTime();
    });
  }

  async getApplication(applicationId: string): Promise<HrApplicationDetail> {
    await delay(QUERY_DELAY);
    const snapshot = mockDatabase.snapshot();
    const { jobs, applications } = ownedData(snapshot);
    const application = applications.find((item) => item.id === applicationId);
    if (!application) throw new MockHrApiError("Không tìm thấy hồ sơ hoặc bạn không có quyền xem hồ sơ này.", "HR_APPLICATION_NOT_FOUND");
    const candidate = snapshot.users.find((item) => item.id === application.candidateId);
    const job = jobs.find((item) => item.id === application.jobId);
    if (!candidate || !job) throw new MockHrApiError("Dữ liệu hồ sơ không còn liên kết hợp lệ.", "HR_APPLICATION_DATA_INVALID");
    return {
      ...structuredClone(application),
      candidateName: candidate.fullName,
      candidateEmail: candidate.email,
      candidateEmployeeCode: candidate.employeeCode,
      jobTitle: job.title,
      departmentName: job.departmentName,
      jobLocation: job.location,
      competencyEvidence: buildCompetencyEvidence(application, job),
      histories: snapshot.applicationHistories.filter((entry) => entry.applicationId === application.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      notes: snapshot.applicationNotes.filter((note) => note.applicationId === application.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      careerPathStatus: snapshot.careerPathStatuses[application.id] ?? "NOT_STARTED",
      talentPoolConsent: snapshot.talentPoolConsents[application.candidateId] ?? false,
      talentPoolEntryId: snapshot.talentPoolEntries.find((entry) => entry.hrId === CURRENT_HR_ID && entry.candidateId === application.candidateId)?.id,
    };
  }

  async updateApplicationStatus(input: UpdateHrApplicationStatusInput): Promise<HrApplicationDetail> {
    await delay(MUTATION_DELAY);
    const snapshot = mockDatabase.snapshot();
    const actor = getCurrentHrFromSnapshot(snapshot);
    const { applications } = ownedData(snapshot);
    const current = applications.find((item) => item.id === input.applicationId);
    if (!current) throw new MockHrApiError("Không tìm thấy hồ sơ hoặc bạn không có quyền cập nhật.", "HR_APPLICATION_NOT_FOUND");
    const allowed: Record<RecruitmentStatus, RecruitmentStatus[]> = {
      PENDING: ["REVIEWING", "REJECTED"],
      REVIEWING: ["SHORTLISTED", "REJECTED"],
      SHORTLISTED: ["HIRED", "REJECTED"],
      REJECTED: ["REVIEWING"],
      HIRED: ["REVIEWING"],
    };
    if (!allowed[current.recruitmentStatus].includes(input.status)) throw new MockHrApiError("Bước xử lý hồ sơ không hợp lệ.", "HR_APPLICATION_STATUS_INVALID");
    if (input.status === "REJECTED" && !input.reason?.trim()) throw new MockHrApiError("Vui lòng chọn lý do không phù hợp.", "HR_REJECTION_REASON_REQUIRED");
    const updated = mockDatabase.updateApplication(current.id, { recruitmentStatus: input.status });
    if (!updated) throw new MockHrApiError("Không thể cập nhật hồ sơ.");
    const createdAt = new Date().toISOString();
    mockDatabase.addApplicationHistory({
      id: `history-${current.id}-${Date.now()}`,
      applicationId: current.id,
      fromStatus: current.recruitmentStatus,
      toStatus: input.status,
      actorId: actor.id,
      actorName: actor.fullName,
      reason: input.reason?.trim(),
      createdAt,
    });
    const candidate = snapshot.users.find((item) => item.id === current.candidateId);
    mockDatabase.addActivity({
      id: `act-app-status-${Date.now()}`,
      kind: "APPLICATION_STATUS_CHANGED",
      actorName: actor.fullName,
      description: "đã cập nhật quyết định tuyển dụng",
      targetLabel: candidate?.fullName ?? current.id.toUpperCase(),
      targetHref: `/admin/applications/${current.id}`,
      createdAt,
    });
    if (input.status === "REJECTED") {
      mockDatabase.setCareerPathStatus(current.id, "PROCESSING");
      await delay(360);
      mockDatabase.setCareerPathStatus(current.id, current.aiStatus === "COMPLETED" ? "READY" : "INSUFFICIENT_INPUT");
    } else {
      mockDatabase.setCareerPathStatus(current.id, "NOT_STARTED");
    }
    return this.getApplication(current.id);
  }

  async addApplicationNote(input: AddHrApplicationNoteInput) {
    await delay(MUTATION_DELAY);
    const snapshot = mockDatabase.snapshot();
    const actor = getCurrentHrFromSnapshot(snapshot);
    const { applications } = ownedData(snapshot);
    if (!applications.some((item) => item.id === input.applicationId)) throw new MockHrApiError("Không tìm thấy hồ sơ hoặc bạn không có quyền ghi chú.", "HR_APPLICATION_NOT_FOUND");
    const content = input.content.trim();
    if (content.length < 3 || content.length > 500) throw new MockHrApiError("Ghi chú cần từ 3 đến 500 ký tự.", "HR_NOTE_INVALID");
    const note = { id: `note-${Date.now()}`, applicationId: input.applicationId, authorId: actor.id, authorName: actor.fullName, content, createdAt: new Date().toISOString() };
    mockDatabase.addApplicationNote(note);
    return note;
  }

  async getTalentPool(filters: TalentPoolFilters = {}): Promise<TalentPoolListItem[]> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") return [];
    const snapshot = mockDatabase.snapshot();
    getCurrentHrFromSnapshot(snapshot);
    const query = normalize(filters.search ?? "");
    return snapshot.talentPoolEntries
      .filter((entry) => entry.hrId === CURRENT_HR_ID)
      .map((entry) => toTalentPoolListItem(snapshot, entry))
      .filter((entry) => {
        const matchesSearch = !query || normalize(`${entry.candidateName} ${entry.candidateEmail} ${entry.skills.join(" ")}`).includes(query);
        const matchesFamily = !filters.jobFamilyId || filters.jobFamilyId === "ALL" || entry.jobFamilyId === filters.jobFamilyId;
        const matchesLevel = !filters.careerLevelId || filters.careerLevelId === "ALL" || entry.careerLevelId === filters.careerLevelId;
        const matchesLabel = !filters.label || filters.label === "ALL" || entry.labels.includes(filters.label);
        return matchesSearch && matchesFamily && matchesLevel && matchesLabel;
      })
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  async saveTalentPoolEntry(input: SaveTalentPoolInput): Promise<TalentPoolListItem> {
    await delay(MUTATION_DELAY);
    const snapshot = mockDatabase.snapshot();
    getCurrentHrFromSnapshot(snapshot);
    const { jobs, applications } = ownedData(snapshot);
    const application = applications.find((item) => item.id === input.applicationId);
    if (!application) throw new MockHrApiError("Không tìm thấy hồ sơ hoặc bạn không có quyền lưu.", "HR_APPLICATION_NOT_FOUND");
    if (!snapshot.talentPoolConsents[application.candidateId]) throw new MockHrApiError("Ứng viên chưa đồng ý lưu hồ sơ cho nhu cầu tuyển dụng sau.", "HR_TALENT_CONSENT_REQUIRED");
    if (snapshot.talentPoolEntries.some((entry) => entry.hrId === CURRENT_HR_ID && entry.candidateId === application.candidateId)) throw new MockHrApiError("Ứng viên đã có trong kho tiềm năng.", "HR_TALENT_DUPLICATE");
    const job = jobs.find((item) => item.id === application.jobId);
    if (!job) throw new MockHrApiError("Không tìm thấy tin ứng tuyển gốc.", "HR_JOB_NOT_FOUND");
    if (new Date(input.retentionUntil).getTime() <= Date.now()) throw new MockHrApiError("Hạn lưu dữ liệu phải ở tương lai.", "HR_TALENT_RETENTION_INVALID");
    const entry = {
      id: `talent-${Date.now()}`,
      hrId: CURRENT_HR_ID,
      candidateId: application.candidateId,
      applicationId: application.id,
      jobFamilyId: job.jobFamilyId,
      careerLevelId: job.careerLevelId,
      labels: [...new Set(input.labels.map((item) => item.trim()).filter(Boolean))].slice(0, 6),
      note: input.note.trim(),
      savedAt: new Date().toISOString(),
      retentionUntil: new Date(`${input.retentionUntil}T23:59:59`).toISOString(),
    };
    mockDatabase.addTalentPoolEntry(entry);
    return toTalentPoolListItem(mockDatabase.snapshot(), entry);
  }

  async updateTalentPoolEntry(input: UpdateTalentPoolInput): Promise<TalentPoolListItem> {
    await delay(MUTATION_DELAY);
    const snapshot = mockDatabase.snapshot();
    getCurrentHrFromSnapshot(snapshot);
    const current = snapshot.talentPoolEntries.find((entry) => entry.id === input.entryId && entry.hrId === CURRENT_HR_ID);
    if (!current) throw new MockHrApiError("Không tìm thấy ứng viên trong kho của bạn.", "HR_TALENT_NOT_FOUND");
    if (new Date(input.retentionUntil).getTime() <= Date.now()) throw new MockHrApiError("Hạn lưu dữ liệu phải ở tương lai.", "HR_TALENT_RETENTION_INVALID");
    const updated = mockDatabase.updateTalentPoolEntry(current.id, {
      labels: [...new Set(input.labels.map((item) => item.trim()).filter(Boolean))].slice(0, 6),
      note: input.note.trim(),
      retentionUntil: new Date(`${input.retentionUntil}T23:59:59`).toISOString(),
    });
    if (!updated) throw new MockHrApiError("Không thể cập nhật kho ứng viên.");
    return toTalentPoolListItem(mockDatabase.snapshot(), updated);
  }

  async removeTalentPoolEntry(entryId: string): Promise<void> {
    await delay(MUTATION_DELAY);
    const snapshot = mockDatabase.snapshot();
    getCurrentHrFromSnapshot(snapshot);
    const current = snapshot.talentPoolEntries.find((entry) => entry.id === entryId && entry.hrId === CURRENT_HR_ID);
    if (!current) throw new MockHrApiError("Không tìm thấy ứng viên trong kho của bạn.", "HR_TALENT_NOT_FOUND");
    if (!mockDatabase.removeTalentPoolEntry(current.id)) throw new MockHrApiError("Không thể xóa ứng viên khỏi kho.");
  }

  async getNotifications() {
    await delay(180);
    if (getMockScenario() === "empty") return [];
    const snapshot = mockDatabase.snapshot();
    getCurrentHrFromSnapshot(snapshot);
    return snapshot.hrNotifications.filter((item) => item.hrId === CURRENT_HR_ID).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationRead(notificationId: string) {
    await delay(120);
    const snapshot = mockDatabase.snapshot();
    getCurrentHrFromSnapshot(snapshot);
    const notification = snapshot.hrNotifications.find((item) => item.id === notificationId && item.hrId === CURRENT_HR_ID);
    if (!notification) throw new MockHrApiError("Không tìm thấy thông báo.", "HR_NOTIFICATION_NOT_FOUND");
    return mockDatabase.markHrNotificationRead(notification.id) ?? notification;
  }

  async markAllNotificationsRead() {
    await delay(120);
    const snapshot = mockDatabase.snapshot();
    getCurrentHrFromSnapshot(snapshot);
    mockDatabase.markAllHrNotificationsRead(CURRENT_HR_ID);
  }
}

export const mockHrService = new MockHrService();
