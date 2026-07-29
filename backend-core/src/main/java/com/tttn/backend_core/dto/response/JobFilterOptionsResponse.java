package com.tttn.backend_core.dto.response;

import java.util.List;
import java.util.UUID;

public record JobFilterOptionsResponse(
    List<JobFamilyOption> jobFamilies, List<CareerLevelOption> careerLevels) {

  public record JobFamilyOption(UUID id, String name, String status) {}

  public record CareerLevelOption(UUID id, String name, Integer rankValue, String status) {}
}
