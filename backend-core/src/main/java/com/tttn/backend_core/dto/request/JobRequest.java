package com.tttn.backend_core.dto.request;

import com.tttn.backend_core.entity.EmploymentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class JobRequest {

  @NotBlank(message = "TITLE_REQUIRED")
  private String title;

  @NotBlank(message = "LOCATION_REQUIRED")
  private String location;

  @NotNull(message = "EMPLOYMENT_TYPE_REQUIRED")
  private EmploymentType employmentType;

  @NotBlank(message = "DESCRIPTION_REQUIRED")
  private String description;

  @NotBlank(message = "REQUIREMENTS_REQUIRED")
  private String requirements;

  private String benefits;

  private UUID jobFamilyId;

  private UUID careerLevelId;

  private LocalDateTime expiredAt;
}
