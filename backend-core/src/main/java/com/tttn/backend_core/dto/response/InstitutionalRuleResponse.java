package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.InstitutionalEvidenceSource;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Flat response for the HR rule catalog. Never expose the JPA relationship graph directly. */
public record InstitutionalRuleResponse(
    UUID id,
    String ruleCode,
    String name,
    String description,
    BigDecimal bonusPoints,
    BigDecimal maxImpactPercent,
    String appliesToDomain,
    PedigreeGroupItem pedigreeGroup,
    List<JobFamilyItem> jobFamilies,
    boolean isActive) {

  public record PedigreeGroupItem(
      UUID id, String code, String name, InstitutionalEvidenceSource evidenceSource) {}

  public record JobFamilyItem(UUID id, String name, String description, boolean isActive) {}
}
