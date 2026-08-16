package com.tttn.backend_core.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobParseResponse {
  private JobInfo jobInfo;
  private List<CompetencyProposal> competencyProposals;
  private List<RuleSuggestion> suggestedRules;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class JobInfo {
    private String title;
    private String location;
    private String employmentType;
    private String description;
    private String requirements;
    private String benefits;
    private String jobFamilyId;
    private String careerLevelId;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CompetencyProposal {
    private UUID competencyId;
    private String name;
    private String category;
    private Integer requiredLevel;
    private Double weight;
    private Boolean isMandatory;
    private String reason;
    private String status;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class RuleSuggestion {
    private UUID ruleId;
    private String reason;
  }
}
