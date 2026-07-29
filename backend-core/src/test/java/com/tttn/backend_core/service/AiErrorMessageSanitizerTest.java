package com.tttn.backend_core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;

class AiErrorMessageSanitizerTest {

  @Test
  void returnsFriendlyMessageForKnownCode() {
    assertEquals(
        "Tệp CV không đúng định dạng hoặc không có nội dung có thể đọc.",
        AiErrorMessageSanitizer.toPublicMessage("invalid_file"));
  }

  @Test
  void neverReturnsUnknownTechnicalMessage() {
    String message = AiErrorMessageSanitizer.toPublicMessage("PROVIDER_SECRET_ERROR");

    assertEquals("Quy trình AI gặp sự cố chưa xác định và chưa thể hoàn tất.", message);
    assertFalse(message.contains("PROVIDER_SECRET_ERROR"));
  }
}
