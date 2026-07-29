package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompetencyKnowledgeRequest(
    @NotBlank(message = "INVALID_KEY") @Size(min = 2, max = 180, message = "INVALID_KEY")
        String name,
    @NotBlank(message = "INVALID_KEY") @Size(min = 2, max = 180, message = "INVALID_KEY")
        String category,
    @NotBlank(message = "INVALID_KEY") @Size(min = 2, max = 180, message = "INVALID_KEY")
        String description) {}
