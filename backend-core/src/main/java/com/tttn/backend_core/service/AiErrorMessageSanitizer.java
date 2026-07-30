package com.tttn.backend_core.service;

import java.util.Locale;
import java.util.Map;

final class AiErrorMessageSanitizer {

  private static final String UNKNOWN_MESSAGE =
      "Quy trình AI gặp sự cố chưa xác định và chưa thể hoàn tất.";

  private static final Map<String, String> MESSAGES =
      Map.ofEntries(
          Map.entry(
              "INVALID_FILE", "Tệp CV không đúng định dạng hoặc không có nội dung có thể đọc."),
          Map.entry("FILE_UNAVAILABLE", "Hệ thống chưa thể tải tệp CV để thực hiện xử lý."),
          Map.entry(
              "AI_PROCESSING_FAILED", "Quy trình AI gặp sự cố kỹ thuật và chưa tạo được kết quả."),
          Map.entry("AI_TIMEOUT", "Quy trình AI chưa hoàn tất trong thời gian cho phép."),
          Map.entry(
              "CAREER_PATH_INTERNAL_ERROR",
              "Bước xây dựng lộ trình nghề nghiệp gặp sự cố kỹ thuật."),
          Map.entry(
              "REQUEST_VALIDATION_ERROR", "Dữ liệu gửi tới quy trình AI chưa đáp ứng yêu cầu."),
          Map.entry("INTERNAL_SERVER_ERROR", "Dịch vụ AI tạm thời gián đoạn."));

  private AiErrorMessageSanitizer() {}

  static String toPublicMessage(String errorCode) {
    if (errorCode == null || errorCode.isBlank()) {
      return UNKNOWN_MESSAGE;
    }
    return MESSAGES.getOrDefault(errorCode.trim().toUpperCase(Locale.ROOT), UNKNOWN_MESSAGE);
  }
}
