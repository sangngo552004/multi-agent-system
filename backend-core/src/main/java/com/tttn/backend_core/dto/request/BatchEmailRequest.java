package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchEmailRequest {

  @NotEmpty(message = "Application IDs list cannot be empty")
  private List<UUID> applicationIds;

  @NotNull(message = "Action cannot be null")
  @Pattern(regexp = "^(INVITE|REJECT)$", message = "Action must be INVITE or REJECT")
  private String action;
}
