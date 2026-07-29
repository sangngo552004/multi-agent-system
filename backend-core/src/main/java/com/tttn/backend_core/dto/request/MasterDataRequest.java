package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MasterDataRequest {
  @NotBlank(message = "NAME_REQUIRED")
  private String name;

  private String description;
}
