package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.Role;
import java.util.UUID;

public record CurrentUserResponse(UUID id, String fullName, String email, Role role) {}
