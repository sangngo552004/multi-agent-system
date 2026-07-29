package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.EmploymentType;
import com.tttn.backend_core.entity.JobStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminJobResponse(
    UUID id,
    String title,
    String departmentName,
    UUID ownerId,
    String ownerName,
    JobStatus status,
    String location,
    EmploymentType employmentType,
    Integer openingsCount,
    String description,
    List<String> requirements,
    List<String> benefits,
    UUID jobFamilyId,
    String jobFamilyName,
    UUID careerLevelId,
    String careerLevelName,
    List<JobCompetencyResponse> competencies,
    LocalDateTime createdAt,
    LocalDateTime expiresAt,
    long applicationCount,
    boolean matchingReady) {

  public record JobCompetencyResponse(
      UUID competencyId, String name, Integer requiredLevel, Double weight, boolean mandatory) {}
}
