package com.tttn.backend_core.security;

import java.security.Principal;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CustomUserPrincipal implements Principal {
  private UUID userId;
  private String role;
  private String email;

  public CustomUserPrincipal(UUID userId, String role) {
    this(userId, role, null);
  }

  public CustomUserPrincipal(UUID userId, String role, String email) {
    this.userId = userId;
    this.role = role;
    this.email = email;
  }

  @Override
  public String getName() {
    return email != null ? email : (userId != null ? userId.toString() : null);
  }
}
