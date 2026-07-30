package com.tttn.backend_core.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
  private String token;
  @JsonIgnore private String refreshToken;
  private UUID userId;
  private String email;
  private String role;
}
