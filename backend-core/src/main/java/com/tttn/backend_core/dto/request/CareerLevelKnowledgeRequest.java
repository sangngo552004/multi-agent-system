package com.tttn.backend_core.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CareerLevelKnowledgeRequest(
    @NotBlank(message = "INVALID_KEY") @Size(min = 2, max = 180, message = "INVALID_KEY")
        String name,
    @NotBlank(message = "INVALID_KEY") @Size(min = 2, max = 180, message = "INVALID_KEY")
        String description,
    @NotNull(message = "INVALID_KEY")
        @Min(value = 1, message = "INVALID_KEY")
        @Max(value = 20, message = "INVALID_KEY")
        Integer rankValue) {}
