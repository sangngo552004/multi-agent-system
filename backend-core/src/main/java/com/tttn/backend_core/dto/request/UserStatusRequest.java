package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserStatusRequest(
    @NotNull(message = "USER_STATUS_REQUIRED") AccountStatus status,
    @NotBlank(message = "STATUS_REASON_REQUIRED")
        @Size(min = 8, max = 240, message = "STATUS_REASON_INVALID")
        String reason) {

  public enum AccountStatus {
    ACTIVE,
    BLOCKED
  }
}
