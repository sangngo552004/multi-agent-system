import type {
  JobDetail,
  JobFilters,
  JobListItem,
  JobListResult,
} from "@/features/admin/jobs/jobs.types";
import { mockDatabase } from "@/mocks/mock-database";
import { getMockScenario } from "@/mocks/mock-scenarios";
import { getJobReadinessIssues } from "@/lib/job-readiness";
import type { AdminJob, JobStatus } from "@/types/domain/admin";

const QUERY_DELAY = 360;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function getReadinessIssues(job: AdminJob) {
  return getJobReadinessIssues(job);
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
  if (!owner) throw new Error("Không tìm thấy HR phụ trách tin này.");
  const applications = snapshot.applications.filter((item) => item.jobId === job.id);
  const readinessIssues = getReadinessIssues(job);

  return {
    ...job,
    ownerName: owner.fullName,
    owner: {
      id: owner.id,
      fullName: owner.fullName,
      email: owner.email,
      departmentName: owner.departmentName,
      employeeCode: owner.employeeCode,
      jobTitle: owner.jobTitle,
    },
    applicationCount: applications.length,
    aiCompletedCount: applications.filter((item) => item.aiStatus === "COMPLETED").length,
    aiFailedCount: applications.filter((item) => item.aiStatus === "FAILED").length,
    matchingReady: readinessIssues.length === 0,
    readinessIssues,
  };
}

class MockJobService {
  async getJobs(filters: JobFilters = {}): Promise<JobListResult> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") {
      return { items: [], statusCounts: { DRAFT: 0, OPEN: 0, PAUSED: 0, CLOSED: 0 } };
    }

    const query = normalize(filters.search ?? "");
    const baseItems = mockDatabase.snapshot().jobs.map(toListItem).filter((job) => {
      const matchesSearch = !query || normalize(`${job.title} ${job.departmentName} ${job.ownerName}`).includes(query);
      const matchesFamily = !filters.jobFamilyId || filters.jobFamilyId === "ALL" || job.jobFamilyId === filters.jobFamilyId;
      const matchesLevel = !filters.careerLevelId || filters.careerLevelId === "ALL" || job.careerLevelId === filters.careerLevelId;
      const matchesReadiness = !filters.readiness || filters.readiness === "ALL"
        || (filters.readiness === "READY" && job.matchingReady)
        || (filters.readiness === "INCOMPLETE" && !job.matchingReady);
      return matchesSearch && matchesFamily && matchesLevel && matchesReadiness;
    });
    const statuses: JobStatus[] = ["DRAFT", "OPEN", "PAUSED", "CLOSED"];
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
}

export const mockJobService = new MockJobService();
