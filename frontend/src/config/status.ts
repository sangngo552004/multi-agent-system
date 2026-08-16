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
  PUBLISHED: { label: "Đang tuyển", tone: "success" },
  PAUSED: { label: "Tạm dừng", tone: "warning" },
  CLOSED: { label: "Đã đóng", tone: "neutral" },
} as const satisfies Record<string, StatusPresentation>;

export const recruitmentStatusMap = {
  PENDING: { label: "Mới nhận", tone: "neutral" },
  PENDING_HR_REVIEW: { label: "Chờ HR xem xét", tone: "info" },
  REVIEWING: { label: "Đang xem xét", tone: "info" },
  SHORTLISTED: { label: "Đã duyệt", tone: "warning" },
  PENDING_EMAIL_SEND: { label: "Đang gửi email", tone: "info" },
  REJECTED: { label: "Không phù hợp", tone: "danger" },
  REJECTED_FINAL: { label: "Đã gửi thư từ chối", tone: "danger" },
  INVITED: { label: "Đã gửi thư mời", tone: "success" },
  HIRED: { label: "Đã tuyển", tone: "success" },
} as const satisfies Record<string, StatusPresentation>;

export const aiStatusMap = {
  WAITING: { label: "Đang chờ", tone: "neutral" },
  PROCESSING: { label: "Đang xử lý", tone: "info" },
  COMPLETED: { label: "Hoàn thành", tone: "success" },
  FAILED: { label: "Thất bại", tone: "danger" },
} as const satisfies Record<string, StatusPresentation>;
