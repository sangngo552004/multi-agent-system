import type { HrService } from "@/services/contracts/hr-service";
import { apiRequest } from "./api-client";
import { adminQueryString as buildQueryString } from "./http-admin.shared";
import type { ChangeHrJobStatusInput, HrCatalogOptions, HrJobDetail, HrJobFilters, HrJobListResult, SaveHrJobInput } from "@/features/hr/jobs/jobs.types";
import type { HrDashboardData, HrDashboardRange } from "@/features/hr/dashboard/dashboard.types";
import type { HrApplicationDetail, HrApplicationFilters, HrApplicationListItem, UpdateHrApplicationStatusInput } from "@/features/hr/applications/applications.types";

function toHrJob(job: Record<string, unknown>): HrJobDetail {
  const competencies = (job.competencies as HrJobDetail["competencies"] | undefined) ?? [];
  const expiresAt = String(job.expiredAt ?? new Date(0).toISOString());
  const expiresAtMs = Date.parse(expiresAt);
  const isExpired = Number.isFinite(expiresAtMs) && expiresAtMs < Date.now();
  return {
    id: String(job.id), title: String(job.title ?? ""), location: String(job.location ?? ""),
    employmentType: job.employmentType as HrJobDetail["employmentType"],
    status: job.status as HrJobDetail["status"], description: String(job.description ?? ""),
    requirements: String(job.requirements ?? "").split("\n"), benefits: String(job.benefits ?? "").split("\n"),
    jobFamilyId: job.jobFamilyId as string | undefined, jobFamilyName: job.jobFamilyName as string | undefined,
    careerLevelId: job.careerLevelId as string | undefined, careerLevelName: job.careerLevelName as string | undefined,
    departmentName: String(job.departmentName ?? ""), ownerId: "", openingsCount: Number(job.openingsCount ?? 0),
    competencies, createdAt: String(job.createdAt ?? ""), expiresAt,
    applicationCount: 0, newApplicationCount: 0, matchingReady: competencies.length > 0,
    expiresSoon: !isExpired && Number.isFinite(expiresAtMs) && expiresAtMs - Date.now() < 7 * 86_400_000,
    expired: isExpired, ruleIds: [], readinessIssues: [], pipelineCounts: {} as HrJobDetail["pipelineCounts"],
    aiCompletedCount: 0, aiFailedCount: 0, recentApplications: [],
  };
}

function toHrApplication(item: Record<string, unknown>): HrApplicationDetail {
  const status = item.status === "PENDING_HR_REVIEW" ? "PENDING" : item.status as HrApplicationDetail["recruitmentStatus"];
  const aiStatus = item.aiStatus as HrApplicationDetail["aiStatus"];
  const score = item.fitScore == null ? undefined : Number(item.fitScore);
  return {
    id: String(item.id), candidateId: String(item.candidateId), candidateName: String(item.candidateName ?? ""), candidateEmail: String(item.candidateEmail ?? ""),
    jobId: String(item.jobId), jobTitle: String(item.jobTitle ?? ""), jobLocation: String(item.jobLocation ?? ""), departmentName: String(item.departmentName ?? ""),
    recruitmentStatus: status, aiStatus, submittedAt: String(item.appliedAt ?? ""), updatedAt: String(item.updatedAt ?? ""),
    matchScore: score, aiConfidence: Number(item.aiConfidence ?? 0), needsReview: Boolean(item.needsReview),
    extractionMethod: "TEXT_LAYER", extractionWarnings: [], errorCode: item.aiErrorCode as HrApplicationDetail["errorCode"], errorMessage: item.aiErrorMessage as string | undefined,
    canRetry: false, personalSummary: String(item.aiFeedback ?? "Chưa có nhận xét AI."), skillGroups: [], experiences: [], education: [], languages: [],
    scoreBreakdown: undefined, matchedSkills: [], missingSkills: [], growthAreas: [], careerPath: [],
    competencyEvidence: [], histories: [], notes: [], careerPathStatus: "NOT_STARTED", talentPoolConsent: false,
  };
}

export const httpHrService: HrService = {
  getCurrentHr: async () => {
    const user = await apiRequest<{ id: string; fullName: string; email: string; role: "HR" }>("/api/v1/auth/me");
    return { ...user, status: "ACTIVE", jobsCount: 0, applicationsCount: 0, createdAt: new Date(0).toISOString() };
  },
  getCatalogOptions: async (): Promise<HrCatalogOptions> => {
    const [jobFamilies, careerLevels, competencies] = await Promise.all([
      apiRequest<{ content: Array<Record<string, unknown>> }>("/api/v1/hr/job-families?size=1000"),
      apiRequest<{ content: Array<Record<string, unknown>> }>("/api/v1/hr/career-levels?size=1000"),
      apiRequest<{ content: Array<Record<string, unknown>> }>("/api/v1/hr/competencies?size=1000"),
    ]);
    return {
      jobFamilies: (jobFamilies.content || []).filter((x) => Boolean(x.isActive)).map((x) => ({ id: String(x.id), name: String(x.name) })),
      careerLevels: (careerLevels.content || []).filter((x) => Boolean(x.isActive)).map((x) => ({ id: String(x.id), name: String(x.name) })),
      competencies: (competencies.content || []).filter((x) => Boolean(x.isActive)).map((x) => ({ id: String(x.id), name: String(x.name), category: String(x.category) })),
    };
  },

  getDashboard: async (range: HrDashboardRange): Promise<HrDashboardData> => {
    const data = await apiRequest<{ generatedAt: string; hasData: boolean; jobs?: Record<string, number>; applications?: Record<string, number> }>(`/api/v1/hr/dashboard?rangeDays=${range}`);
    const jobs = data.jobs ?? {}; const applications = data.applications ?? {};
    return {
      range, generatedAt: String(data.generatedAt), hasData: Boolean(data.hasData),
      metrics: [
        { id: "open-jobs", label: "Tin đang mở", value: Number(jobs.published ?? 0), note: "Đang nhận CV", href: "/hr/jobs" },
        { id: "new-applications", label: "CV mới", value: Number(applications.newApplications ?? 0), note: `${range} ngày gần đây`, href: "/hr/applications" },
        { id: "pending-review", label: "Cần đối chiếu", value: Number(applications.needsReview ?? 0), note: "Cần HR kiểm tra", href: "/hr/applications?review=REQUIRED", emphasis: true },
        { id: "shortlisted", label: "Danh sách ngắn", value: Number(applications.shortlisted ?? 0), note: "Đã duyệt", href: "/hr/applications?status=SHORTLISTED" },
        { id: "expiring-jobs", label: "Sắp hết hạn", value: Number(jobs.expiringSoon ?? 0), note: "Trong 7 ngày", href: "/hr/jobs" },
      ],
      attention: [
        { id: "ai-failed", label: "AI xử lý thất bại", description: "CV cần xem xét thủ công", count: Number(applications.aiFailed ?? 0), href: "/hr/applications?aiStatus=FAILED", tone: "danger" },
        { id: "low-confidence", label: "Cần đối chiếu CV", description: "AI đánh dấu cần kiểm tra", count: Number(applications.needsReview ?? 0), href: "/hr/applications?review=REQUIRED", tone: "warning" },
      ].filter((item) => item.count > 0),
      trend: [], funnel: [
        { status: "PENDING", label: "Mới nhận", value: Number(applications.newApplications ?? 0), color: "#CFE574" },
        { status: "SHORTLISTED", label: "Danh sách ngắn", value: Number(applications.shortlisted ?? 0), color: "#66BFA6" },
        { status: "REJECTED", label: "Không phù hợp", value: Number(applications.rejected ?? 0), color: "#EC8C8C" },
      ], activeJobs: [],
    };
  },

  getJobs: async (filters?: HrJobFilters): Promise<HrJobListResult> => {
    const { search, ...rest } = filters || {};
    const page = await apiRequest<{ content: Array<Record<string, unknown>> }>(`/api/v1/hr/jobs${buildQueryString({ ...rest, keyword: search })}`);
    const items = (page.content || []).map(toHrJob);
    return {
      items,
      statusCounts: items.reduce((counts, job) => {
        counts[job.status] = (counts[job.status] || 0) + 1;
        return counts;
      }, { DRAFT: 0, PUBLISHED: 0, PAUSED: 0, CLOSED: 0 }),
    };
  },

  getJob: async (jobId: string): Promise<HrJobDetail> => {
    // Backend return Job response, we map it to HrJobDetail
    const job = await apiRequest<Record<string, unknown>>(`/api/v1/hr/jobs/${jobId}`);
    return toHrJob(job);
  },

  saveJob: async (input: SaveHrJobInput): Promise<HrJobDetail> => {
    const payload = {
      title: input.values.title,
      location: input.values.location,
      employmentType: input.values.employmentType,
      description: input.values.description,
      requirements: input.values.requirementsText.join('\n'),
      benefits: input.values.benefitsText.join('\n'),
      jobFamilyId: input.values.jobFamilyId,
      careerLevelId: input.values.careerLevelId,
    };

    let savedJob: Record<string, unknown>;
    if (input.jobId) {
      savedJob = await apiRequest(`/api/v1/hr/jobs/${input.jobId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      savedJob = await apiRequest('/api/v1/hr/jobs', { method: 'POST', body: JSON.stringify(payload) });
    }

    if (input.values.ruleIds) {
      await apiRequest(`/api/v1/hr/jobs/${savedJob.id}/rules`, {
        method: 'PUT',
        body: JSON.stringify({ ruleIds: input.values.ruleIds })
      });
    }

    if (input.values.competencies) {
      await apiRequest(`/api/v1/hr/jobs/${savedJob.id}/competencies`, {
        method: 'PUT',
        body: JSON.stringify(input.values.competencies.map(c => ({
          competencyId: c.competencyId,
          weight: c.weight,
          requiredLevel: c.requiredLevel,
          isMandatory: c.mandatory
        })))
      });
    }

    if (input.publish) {
      savedJob = await apiRequest(`/api/v1/hr/jobs/${savedJob.id}/publish`, { method: 'POST' });
    }

    return httpHrService.getJob(savedJob.id as string);
  },

  changeJobStatus: async (input: ChangeHrJobStatusInput): Promise<HrJobDetail> => {
    let endpoint = "";
    if (input.status === "PUBLISHED") endpoint = "publish";
    else if (input.status === "CLOSED") endpoint = "close";

    if (endpoint) {
      await apiRequest(`/api/v1/hr/jobs/${input.jobId}/${endpoint}`, { method: 'POST' });
    }
    return httpHrService.getJob(input.jobId);
  },

  duplicateJob: async (jobId: string): Promise<HrJobDetail> => {
    const duplicated = await apiRequest<Record<string, unknown>>(`/api/v1/hr/jobs/${jobId}/duplicate`, { method: 'POST' });
    return httpHrService.getJob(duplicated.id as string);
  },

  getApplications: async (filters: HrApplicationFilters = {}): Promise<HrApplicationListItem[]> => {
    const query = buildQueryString({ jobId: filters.jobId, status: filters.recruitmentStatus, aiStatus: filters.aiStatus, needsReview: filters.review === "REQUIRED" ? true : undefined, search: filters.search, page: 0, size: 100 });
    const page = await apiRequest<{ content: Array<Record<string, unknown>> }>(`/api/v1/hr/applications${query}`);
    return page.content.map((item) => toHrApplication(item));
  },
  getApplication: async (applicationId: string): Promise<HrApplicationDetail> => toHrApplication(await apiRequest<Record<string, unknown>>(`/api/v1/hr/applications/${applicationId}`)),
  updateApplicationStatus: async (input: UpdateHrApplicationStatusInput): Promise<HrApplicationDetail> => {
    const path = input.status === "SHORTLISTED" ? "approve" : "reject";
    await apiRequest(`/api/v1/hr/applications/${input.applicationId}/${path}`, { method: "POST" });
    return httpHrService.getApplication(input.applicationId);
  },
  addApplicationNote: async () => { throw new Error("Ghi chú nội bộ chưa thuộc phase này."); },
  getTalentPool: async () => { throw new Error("Talent pool không thuộc phase này."); },
  saveTalentPoolEntry: async () => { throw new Error("Talent pool không thuộc phase này."); },
  updateTalentPoolEntry: async () => { throw new Error("Talent pool không thuộc phase này."); },
  removeTalentPoolEntry: async () => { throw new Error("Talent pool không thuộc phase này."); },
  getNotifications: async () => [],
  markNotificationRead: async () => { throw new Error("Thông báo không thuộc phase này."); },
  markAllNotificationsRead: async () => {},
};
