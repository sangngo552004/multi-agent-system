package com.tttn.backend_core.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Public, read-only catalog consumed by the AI service when parsing and matching jobs. */
public record AiMasterDataResponse(
    List<JobFamilyItem> jobFamilies,
    List<CareerLevelItem> careerLevels,
    List<CompetencyItem> competencies,
    List<RuleItem> rules) {

  public record JobFamilyItem(UUID id, String name, String description) {}

  public record CareerLevelItem(UUID id, String name, Integer rankValue, String description) {}

  public record CompetencyItem(
      UUID id,
      String name,
      String category,
      String description,
      List<CompetencyLevelItem> levels) {}

  public record CompetencyLevelItem(Integer level, String label, String description) {}

  public record RuleItem(
      UUID id,
      String ruleCode,
      String name,
      String description,
      BigDecimal bonusPoints,
      BigDecimal maxImpactPercent) {}
}
