import type { AdminService } from "@/services/contracts/admin-service";
import { httpAdminService } from "@/services/http/http-admin.service";

export const adminService: AdminService = {
  getDashboard: (range) => httpAdminService.getDashboard(range),
  getUsers: (filters) => httpAdminService.getUsers(filters),
  getUser: (userId) => httpAdminService.getUser(userId),
  getUserActivity: (userId) => httpAdminService.getUserActivity(userId),
  updateUserStatus: (input) => httpAdminService.updateUserStatus(input),
  getJobs: (filters) => httpAdminService.getJobs(filters),
  getJobFilterOptions: () => httpAdminService.getJobFilterOptions(),
  getJob: (jobId) => httpAdminService.getJob(jobId),
  getApplications: (filters) => httpAdminService.getApplications(filters),
  getApplication: (applicationId) =>
    httpAdminService.getApplication(applicationId),
  retryApplication: (applicationId, idempotencyKey) =>
    httpAdminService.retryApplication(applicationId, idempotencyKey),
  getActivities: (filters) => httpAdminService.getActivities(filters),
  getKnowledge: () => httpAdminService.getKnowledge(),
  getCompetency: (id) => httpAdminService.getCompetency(id),
  saveJobFamily: (input) => httpAdminService.saveJobFamily(input),
  saveCareerLevel: (input) => httpAdminService.saveCareerLevel(input),
  saveCompetency: (input) => httpAdminService.saveCompetency(input),
  saveCompetencyLevels: (id, levels) =>
    httpAdminService.saveCompetencyLevels(id, levels),
  toggleKnowledge: (input) => httpAdminService.toggleKnowledge(input),
};
