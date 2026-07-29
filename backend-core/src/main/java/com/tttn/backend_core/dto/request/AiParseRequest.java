package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiParseRequest {
  @NotBlank(message = "Job description text is required")
  private String text;
}
