package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.EmploymentType;
import com.tttn.backend_core.entity.JobStatus;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobResponse {
  private UUID id;
  private String title;
  private String location;
  private EmploymentType employmentType;
  private String description;
  private String requirements;
  private String benefits;

  private UUID jobFamilyId;
  private String jobFamilyName;

  private UUID careerLevelId;
  private String careerLevelName;

  private JobStatus status;
  private LocalDateTime expiredAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
