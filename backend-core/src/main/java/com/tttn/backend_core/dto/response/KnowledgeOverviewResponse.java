package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.KnowledgeItemStatus;
import java.util.List;
import java.util.UUID;

public record KnowledgeOverviewResponse(
    List<JobFamilyItem> jobFamilies,
    List<CareerLevelItem> careerLevels,
    List<CompetencyItem> competencies) {

  public record JobFamilyItem(
      UUID id, String name, String description, KnowledgeItemStatus status, long usageCount) {}

  public record CareerLevelItem(
      UUID id,
      String name,
      String description,
      Integer rankValue,
      KnowledgeItemStatus status,
      long usageCount) {}

  public record CompetencyItem(
      UUID id,
      String name,
      String category,
      String description,
      KnowledgeItemStatus status,
      long usageCount,
      int completedLevels,
      List<CompetencyLevelItem> levels) {}

  public record CompetencyLevelItem(Integer level, String title, String description) {}
}
