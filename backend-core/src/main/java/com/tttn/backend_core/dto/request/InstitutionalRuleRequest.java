package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class InstitutionalRuleRequest {
  @NotBlank(message = "RULE_CODE_REQUIRED")
  private String ruleCode;

  @NotBlank(message = "NAME_REQUIRED")
  private String name;

  private String description;

  @NotNull(message = "BONUS_POINTS_REQUIRED")
  private BigDecimal bonusPoints;

  @NotNull(message = "MAX_IMPACT_PERCENT_REQUIRED")
  private BigDecimal maxImpactPercent;

  @NotBlank(message = "DOMAIN_REQUIRED")
  private String appliesToDomain;
}
