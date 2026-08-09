package com.tttn.backend_core.dto.request;

import com.tttn.backend_core.entity.InstitutionalEvidenceSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class PedigreeGroupRequest {
  @NotBlank private String code;
  @NotBlank private String name;
  @NotNull private InstitutionalEvidenceSource evidenceSource;
  private List<UUID> memberIds = List.of();
}
