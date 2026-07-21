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

export type MockDatabaseState = {
  users: AdminUser[];
  jobs: AdminJob[];
  applications: AdminApplication[];
  jobFamilies: JobFamily[];
  careerLevels: CareerLevel[];
  competencies: Competency[];
  activities: ActivityEntry[];
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

  reset() {
    this.state = createInitialState();
  }
}

export const mockDatabase = new MockDatabase();
