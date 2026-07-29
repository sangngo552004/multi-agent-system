package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class JobRuleUpdateRequest {
  @NotNull(message = "RULE_IDS_REQUIRED")
  private List<UUID> ruleIds;
}
