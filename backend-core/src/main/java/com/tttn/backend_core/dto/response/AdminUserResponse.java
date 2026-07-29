package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.Role;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String fullName,
    String email,
    Role role,
    String status,
    String employeeCode,
    String departmentName,
    String jobTitle,
    String workLocation,
    LocalDateTime createdAt,
    LocalDateTime lastActiveAt,
    long jobsCount,
    long applicationsCount,
    String blockReason) {}
