package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.InstitutionalEvidenceSource;
import java.util.List;
import java.util.UUID;
import lombok.Builder;

@Builder
public record PedigreeGroupResponse(
    UUID id,
    String code,
    String name,
    InstitutionalEvidenceSource evidenceSource,
    boolean isActive,
    List<UUID> memberIds) {}
