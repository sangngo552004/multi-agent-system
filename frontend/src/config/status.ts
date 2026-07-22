export type StatusPresentation = {
  label: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

export const userStatusMap = {
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  BLOCKED: { label: "Đã khóa", tone: "danger" },
} as const satisfies Record<string, StatusPresentation>;

export const roleMap = {
  ADMIN: "Quản trị viên",
  HR: "Nhân sự tuyển dụng",
  CANDIDATE: "Ứng viên",
} as const;

export const jobStatusMap = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  OPEN: { label: "Đang tuyển", tone: "success" },
  PAUSED: { label: "Tạm dừng", tone: "warning" },
  CLOSED: { label: "Đã đóng", tone: "neutral" },
} as const satisfies Record<string, StatusPresentation>;

export const recruitmentStatusMap = {
  PENDING: { label: "Mới nhận", tone: "neutral" },
  REVIEWING: { label: "Đang xem xét", tone: "info" },
  SHORTLISTED: { label: "Danh sách ngắn", tone: "warning" },
  REJECTED: { label: "Không phù hợp", tone: "danger" },
  HIRED: { label: "Đã tuyển", tone: "success" },
} as const satisfies Record<string, StatusPresentation>;

export const aiStatusMap = {
  WAITING: { label: "Đang chờ", tone: "neutral" },
  PROCESSING: { label: "Đang xử lý", tone: "info" },
  COMPLETED: { label: "Hoàn thành", tone: "success" },
  FAILED: { label: "Thất bại", tone: "danger" },
} as const satisfies Record<string, StatusPresentation>;
