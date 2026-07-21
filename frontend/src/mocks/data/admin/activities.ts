import type { ActivityEntry } from "@/types/domain/admin";

export const activitySeeds: ActivityEntry[] = [
  ["act-001", "HR_VERIFICATION_CHANGED", "Admin Nguyễn", "đã yêu cầu bổ sung hồ sơ xác minh", "Bùi Ngọc Linh", "/admin/users/usr-008", 1],
  ["act-002", "JOB_SUBMITTED", "Lê Phương Thảo", "đã gửi một tin tuyển dụng để duyệt", "Frontend Developer", "/admin/jobs/job-001", 2],
  ["act-003", "AI_PROCESSING_FAILED", "Hệ thống AI", "không thể hoàn tất phân tích hồ sơ", "Hồ sơ APP-005", "/admin/applications/app-005", 4],
  ["act-004", "APPLICATION_SUBMITTED", "Trần Minh Anh", "đã nộp hồ sơ ứng tuyển", "Data Analyst", "/admin/applications/app-001", 7],
  ["act-005", "USER_STATUS_CHANGED", "Admin Nguyễn", "đã khóa tài khoản do vi phạm quy định", "Đỗ Thành Công", "/admin/users/usr-007", 11],
  ["act-006", "HR_VERIFICATION_CHANGED", "Admin Nguyễn", "đã xác minh nhà tuyển dụng", "Phạm Quốc Bảo", "/admin/users/usr-005", 18],
  ["act-007", "JOB_SUBMITTED", "Ngô Hải Yến", "đã gửi một tin tuyển dụng để duyệt", "UX Researcher", "/admin/jobs/job-008", 26],
  ["act-008", "AI_PROCESSING_FAILED", "Hệ thống AI", "không thể hoàn tất phân tích hồ sơ", "Hồ sơ APP-012", "/admin/applications/app-012", 32],
].map(([id, kind, actorName, description, targetLabel, targetHref, hoursAgo]) => ({
  id: id as string,
  kind: kind as ActivityEntry["kind"],
  actorName: actorName as string,
  description: description as string,
  targetLabel: targetLabel as string,
  targetHref: targetHref as string,
  createdAt: new Date(Date.now() - Number(hoursAgo) * 3_600_000).toISOString(),
}));
