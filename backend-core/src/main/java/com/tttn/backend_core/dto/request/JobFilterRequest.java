package com.tttn.backend_core.dto.request;

import com.tttn.backend_core.entity.EmploymentType;
import com.tttn.backend_core.entity.JobStatus;
import java.util.UUID;
import lombok.Data;

@Data
public class JobFilterRequest {
  private String keyword;
  private String location;
  private EmploymentType employmentType;
  private UUID jobFamilyId;
  private UUID careerLevelId;
  private JobStatus status;
}
