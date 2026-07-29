type AiFailurePresentation = {
  label: string;
  description: string;
  reference: string;
};

const AI_FAILURE_PRESENTATIONS: Record<string, AiFailurePresentation> = {
  INVALID_FILE: {
    label: "Tệp CV không đọc được",
    description:
      "Tệp CV không đúng định dạng hoặc không có nội dung có thể đọc. Ứng viên cần tải lại tệp hợp lệ.",
    reference: "INVALID_FILE",
  },
  FILE_UNAVAILABLE: {
    label: "Không thể truy cập tệp CV",
    description:
      "Hệ thống chưa thể tải tệp CV để xử lý. Có thể chạy lại sau khi kết nối tệp ổn định.",
    reference: "FILE_UNAVAILABLE",
  },
  AI_PROCESSING_FAILED: {
    label: "Quy trình AI bị gián đoạn",
    description:
      "Quy trình xử lý gặp sự cố kỹ thuật và chưa tạo được kết quả.",
    reference: "AI_PROCESSING_FAILED",
  },
  AI_TIMEOUT: {
    label: "Quy trình AI quá thời gian",
    description:
      "Quy trình xử lý chưa hoàn tất trong thời gian cho phép. Có thể chạy lại để tiếp tục.",
    reference: "AI_TIMEOUT",
  },
  CAREER_PATH_INTERNAL_ERROR: {
    label: "Chưa tạo được lộ trình",
    description:
      "Bước xây dựng lộ trình nghề nghiệp gặp sự cố kỹ thuật và chưa hoàn tất.",
    reference: "CAREER_PATH_INTERNAL_ERROR",
  },
  REQUEST_VALIDATION_ERROR: {
    label: "Dữ liệu xử lý chưa hợp lệ",
    description:
      "Dữ liệu gửi tới quy trình AI chưa đáp ứng yêu cầu. Vui lòng kiểm tra lại cấu hình liên quan.",
    reference: "REQUEST_VALIDATION_ERROR",
  },
  INTERNAL_SERVER_ERROR: {
    label: "Dịch vụ AI tạm thời gián đoạn",
    description:
      "Dịch vụ AI gặp sự cố kỹ thuật và chưa thể hoàn tất yêu cầu.",
    reference: "INTERNAL_SERVER_ERROR",
  },
};

const UNKNOWN_AI_FAILURE: AiFailurePresentation = {
  label: "Quy trình AI chưa hoàn tất",
  description:
    "Quy trình xử lý gặp sự cố chưa xác định. Vui lòng chạy lại hoặc kiểm tra nhật ký hệ thống.",
  reference: "AI_UNKNOWN",
};

export function getAiFailurePresentation(
  errorCode: string | null | undefined,
) {
  if (!errorCode) return UNKNOWN_AI_FAILURE;
  return (
    AI_FAILURE_PRESENTATIONS[errorCode.trim().toUpperCase()] ??
    UNKNOWN_AI_FAILURE
  );
}
