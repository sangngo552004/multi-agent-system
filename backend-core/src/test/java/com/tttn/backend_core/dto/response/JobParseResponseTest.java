package com.tttn.backend_core.dto.response;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class JobParseResponseTest {

  private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

  @Test
  void preservesAiParserProposalAndRuleFields() throws Exception {
    String json =
        """
        {
          "jobInfo": {
            "title": "Backend Java Developer",
            "location": "TP. Ho Chi Minh",
            "employmentType": "FULL_TIME",
            "description": "Build APIs",
            "requirements": "Java and Spring Boot",
            "benefits": "Competitive salary",
            "jobFamilyId": "11111111-1111-1111-1111-111111111111",
            "careerLevelId": "dddd0000-0000-0000-0000-000000000000"
          },
          "competencyProposals": [{
            "competencyId": "44444444-4444-4444-4444-444444444441",
            "name": "Java/Spring Boot",
            "category": "HARD_SKILL",
            "requiredLevel": 4,
            "weight": 50,
            "isMandatory": true,
            "reason": "Required by the JD",
            "status": "MATCHED"
          }],
          "suggestedRules": [{
            "ruleId": "55555555-5555-5555-5555-555555555551",
            "reason": "Relevant education rule"
          }]
        }
        """;

    JobParseResponse response = objectMapper.readValue(json, JobParseResponse.class);
    JsonNode forwardedJson = objectMapper.valueToTree(response);

    assertThat(response.getCompetencyProposals()).hasSize(1);
    assertThat(response.getSuggestedRules()).hasSize(1);
    assertThat(forwardedJson.has("competencyProposals")).isTrue();
    assertThat(forwardedJson.has("suggestedRules")).isTrue();
    assertThat(forwardedJson.has("competencies")).isFalse();
  }
}
