package com.tttn.backend_core.dto.request;

import com.tttn.backend_core.entity.PedigreeRank;
import com.tttn.backend_core.entity.PedigreeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PedigreeRequest {

  @NotBlank(message = "Tên tổ chức không được để trống")
  @Size(max = 255)
  private String name;

  @NotNull(message = "Loại tổ chức không được để trống (UNIVERSITY, COMPANY, AGENCY)")
  private PedigreeType type;

  @NotNull(message = "Hạng không được để trống (INTERNATIONAL, TIER_1, TIER_2, TIER_3)")
  private PedigreeRank rank;

  /** Domain áp dụng rule, ví dụ: "ENGINEERING", "SALES_MARKETING", "ALL". Mặc định "ALL". */
  @Size(max = 100)
  private String domain = "ALL";

  @Size(max = 10)
  private String country = "VN";
}
