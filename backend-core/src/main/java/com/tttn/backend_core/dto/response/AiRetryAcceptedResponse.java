package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.AiProcessingStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record AiRetryAcceptedResponse(
    UUID applicationId, UUID runId, AiProcessingStatus status, LocalDateTime acceptedAt) {}
