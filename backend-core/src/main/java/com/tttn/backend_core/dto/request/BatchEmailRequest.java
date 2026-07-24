package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotBlank;
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

  @NotEmpty(message = "EMPTY_APPLICATION_IDS")
  private List<UUID> applicationIds;

  @NotNull(message = "INVALID_ACTION")
  @Pattern(regexp = "^(INVITE|REJECT)$", message = "INVALID_ACTION")
  private String action;

  @NotBlank(message = "SUBJECT_TEMPLATE_REQUIRED")
  private String subjectTemplate;

  @NotBlank(message = "BODY_TEMPLATE_REQUIRED")
  private String bodyTemplate;
}
