package com.tttn.backend_core.dto.request;

import com.tttn.backend_core.entity.PedigreeRank;
import com.tttn.backend_core.entity.PedigreeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PedigreeRequest {

  @NotBlank(message = "ORGANIZATION_NAME_REQUIRED")
  @Size(max = 255)
  private String name;

  @NotNull(message = "ORGANIZATION_TYPE_REQUIRED")
  private PedigreeType type;

  @NotNull(message = "PEDIGREE_RANK_REQUIRED")
  private PedigreeRank rank;

  /** Domain áp dụng rule, ví dụ: "ENGINEERING", "SALES_MARKETING", "ALL". Mặc định "ALL". */
  @Size(max = 100)
  private String domain = "ALL";

  @Size(max = 10)
  private String country = "VN";
}
