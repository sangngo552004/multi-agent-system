package com.tttn.backend_core.security;

import java.security.Principal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CustomUserPrincipal implements Principal {
  private UUID userId;
  private String role;

  @Override
  public String getName() {
    return userId != null ? userId.toString() : null;
  }
}
