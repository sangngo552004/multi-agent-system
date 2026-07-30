package com.tttn.backend_core.dto.response;

import java.util.List;

public record AdminJobDetailResponse(
    AdminJobResponse job,
    AdminJobOwnerResponse owner,
    long aiCompletedCount,
    long aiFailedCount,
    List<String> readinessIssues) {

  public record AdminJobOwnerResponse(
      java.util.UUID id,
      String fullName,
      String email,
      String departmentName,
      String employeeCode,
      String jobTitle) {}
}
