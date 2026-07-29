package com.tttn.backend_core.dto.request;

import com.tttn.backend_core.entity.KnowledgeItemStatus;
import jakarta.validation.constraints.NotNull;

public record KnowledgeStatusRequest(
    @NotNull(message = "INVALID_KEY") KnowledgeItemStatus status, boolean force) {}
