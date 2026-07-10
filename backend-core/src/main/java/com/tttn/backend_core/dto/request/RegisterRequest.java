package com.tttn.backend_core.dto.request;

import com.tttn.backend_core.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {

  @NotBlank(message = "EMAIL_REQUIRED")
  @Email(message = "INVALID_EMAIL")
  private String email;

  @NotBlank(message = "PASSWORD_REQUIRED")
  @jakarta.validation.constraints.Pattern(
      regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$",
      message = "WEAK_PASSWORD")
  private String password;

  @NotBlank(message = "FULL_NAME_REQUIRED")
  private String fullName;

  @NotNull(message = "ROLE_REQUIRED")
  private Role role;
}
