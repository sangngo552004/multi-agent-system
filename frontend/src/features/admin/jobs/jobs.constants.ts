import type { EmploymentType, JobStatus } from "@/types/domain/admin";

export const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  INTERNSHIP: "Thực tập",
  CONTRACT: "Hợp đồng",
};

export const jobStatusTabs: Array<{ value: JobStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "OPEN", label: "Đang tuyển" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "CLOSED", label: "Đã đóng" },
];
