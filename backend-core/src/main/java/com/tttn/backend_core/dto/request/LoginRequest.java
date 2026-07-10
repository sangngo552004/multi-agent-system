package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

  @NotBlank(message = "EMAIL_REQUIRED")
  @Email(message = "INVALID_EMAIL")
  private String email;

  @NotBlank(message = "PASSWORD_REQUIRED")
  private String password;
}
