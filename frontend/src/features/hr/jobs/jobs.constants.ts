import type { EmploymentType, JobStatus } from "@/types/domain/recruitment";

export const hrEmploymentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  INTERNSHIP: "Thực tập",
  CONTRACT: "Hợp đồng",
};

export const hrWorkLocationOptions = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Làm việc từ xa",
  "Hybrid",
];

export const hrJobStatusTabs: Array<{ value: JobStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PUBLISHED", label: "Đang tuyển" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "CLOSED", label: "Đã đóng" },
];
