package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MasterDataRequest {
  @NotBlank(message = "NAME_REQUIRED")
  private String name;

  private String description;

  /**
   * Only used by competency endpoints. The HR knowledge-base UI exposes the supported taxonomy as a
   * fixed choice (HARD_SKILL, SOFT_SKILL, EXPERIENCE, PEDIGREE).
   */
  @Size(max = 180, message = "CATEGORY_INVALID")
  private String category;
}
