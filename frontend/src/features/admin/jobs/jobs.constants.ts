import type { EmploymentType, JobStatus } from "@/types/domain/admin";

export const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  INTERNSHIP: "Thực tập",
  CONTRACT: "Hợp đồng",
};

export const jobStatusTabs: Array<{ value: JobStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "PUBLISHED", label: "Đang hiển thị" },
  { value: "HIDDEN", label: "Đã ẩn" },
  { value: "CLOSED", label: "Đã đóng" },
];
