package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class JobCompetencyRequest {
  @NotNull(message = "COMPETENCY_ID_REQUIRED")
  private UUID competencyId;

  @NotNull(message = "WEIGHT_REQUIRED")
  @Min(value = 0, message = "WEIGHT_REQUIRED")
  @Max(value = 100, message = "WEIGHT_REQUIRED")
  private Double weight;

  @NotNull(message = "LEVEL_REQUIRED")
  @Min(value = 1, message = "LEVEL_REQUIRED")
  @Max(value = 5, message = "LEVEL_REQUIRED")
  private Integer requiredLevel;

  @NotNull(message = "IS_MANDATORY_REQUIRED")
  private Boolean isMandatory;
}
