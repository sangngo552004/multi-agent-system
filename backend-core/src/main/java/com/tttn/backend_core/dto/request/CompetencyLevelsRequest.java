package com.tttn.backend_core.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CompetencyLevelsRequest(
    @NotNull(message = "INVALID_COMPETENCY_LEVELS")
        @Size(min = 5, max = 5, message = "INVALID_COMPETENCY_LEVELS")
        List<@Valid CompetencyLevelInput> levels) {

  public record CompetencyLevelInput(
      @NotNull(message = "INVALID_COMPETENCY_LEVELS")
          @Min(value = 1, message = "INVALID_COMPETENCY_LEVELS")
          @Max(value = 5, message = "INVALID_COMPETENCY_LEVELS")
          Integer level,
      @NotBlank(message = "INVALID_KEY") @Size(min = 2, max = 100, message = "INVALID_KEY")
          String title,
      @NotBlank(message = "INVALID_KEY") @Size(min = 2, max = 2000, message = "INVALID_KEY")
          String description) {}
}
