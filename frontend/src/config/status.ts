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
  HR: "Nhà tuyển dụng",
  CANDIDATE: "Ứng viên",
} as const;

export const verificationStatusMap = {
  NOT_REQUIRED: { label: "Không áp dụng", tone: "neutral" },
  PENDING: { label: "Chờ xác minh", tone: "warning" },
  VERIFIED: { label: "Đã xác minh", tone: "success" },
  CHANGES_REQUESTED: { label: "Cần bổ sung", tone: "info" },
  REJECTED: { label: "Đã từ chối", tone: "danger" },
} as const satisfies Record<string, StatusPresentation>;

export const jobStatusMap = {
  PENDING: { label: "Chờ duyệt", tone: "warning" },
  PUBLISHED: { label: "Đang hiển thị", tone: "success" },
  HIDDEN: { label: "Đã ẩn", tone: "danger" },
  CLOSED: { label: "Đã đóng", tone: "neutral" },
} as const satisfies Record<string, StatusPresentation>;

export const recruitmentStatusMap = {
  PENDING: { label: "Mới nộp", tone: "neutral" },
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
