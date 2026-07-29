import { ApiError } from "@/services/http/api-client";

const ADMIN_ERROR_MESSAGES: Partial<Record<number, string>> = {
  1003: "Không tìm thấy tài khoản hoặc tài khoản đã được xóa.",
  1004: "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.",
  1005: "Bạn không có quyền thực hiện thao tác quản trị này.",
  1012: "Tài khoản đang tạm khóa do đăng nhập sai nhiều lần.",
  1013: "Tài khoản hiện không hoạt động.",
  1015: "Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.",
  1017: "Không tìm thấy hồ sơ ứng tuyển hoặc hồ sơ đã được xóa.",
  1028: "Không thể khóa tài khoản quản trị đang đăng nhập.",
  1029: "Không tìm thấy tin tuyển dụng hoặc tin đã được xóa.",
  1030: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  1031: "Không tìm thấy dữ liệu cấu hình hoặc dữ liệu đã được xóa.",
  1032: "Tên này đã được sử dụng. Vui lòng chọn một tên khác.",
  1033: "Thứ tự cấp bậc này đã được sử dụng.",
  1034:
    "Mục này đang được sử dụng. Hãy xác nhận ngừng sử dụng để tiếp tục.",
  1036: "Thang năng lực cần đủ 5 cấp độ, từ cấp 1 đến cấp 5.",
  1037: "Bộ lọc hồ sơ chưa hợp lệ. Vui lòng xóa bộ lọc và thử lại.",
  1038: "Lượt xử lý gần nhất không còn đủ điều kiện để chạy lại.",
  1039: "Hồ sơ đang được AI xử lý. Không cần tạo thêm lượt chạy.",
  1040: "Yêu cầu chạy lại đã hết hiệu lực. Hãy đóng hộp thoại và thử lại.",
  1041: "Không tìm thấy lượt xử lý AI được yêu cầu.",
  1042: "Dữ liệu đã thay đổi. Vui lòng tải lại trước khi tiếp tục.",
  1043: "Khoảng thời gian báo cáo chưa hợp lệ.",
  1044: "Bộ lọc chưa hợp lệ. Vui lòng xóa bộ lọc và thử lại.",
};

export function getAdminErrorMessage(
  error: unknown,
  fallback = "Không thể hoàn tất yêu cầu lúc này. Vui lòng thử lại sau.",
) {
  if (error instanceof ApiError) {
    const knownMessage = ADMIN_ERROR_MESSAGES[error.code];
    if (knownMessage) return knownMessage;

    if (error.status === 401) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }
    if (error.status === 403) {
      return "Bạn không có quyền thực hiện thao tác quản trị này.";
    }
    if (error.status === 404) {
      return "Không tìm thấy dữ liệu được yêu cầu.";
    }
    if (error.status === 409) {
      return "Dữ liệu đã thay đổi hoặc đang được sử dụng. Vui lòng tải lại.";
    }
    if (error.status === 429) {
      return "Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.";
    }
    if (error.status >= 500) {
      return "Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau.";
    }
    return fallback;
  }

  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return "Máy chủ phản hồi quá lâu. Vui lòng kiểm tra kết nối và thử lại.";
  }
  if (error instanceof TypeError) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  }
  return fallback;
}

export function isAdminErrorRetryable(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  return error.status === 408 || error.status === 429 || error.status >= 500;
}
