package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.AiExtractionMethod;
import com.tttn.backend_core.entity.AiProcessingStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminApplicationResponse(
    UUID id,
    UUID candidateId,
    String candidateName,
    UUID jobId,
    String jobTitle,
    String departmentName,
    AiProcessingStatus aiStatus,
    LocalDateTime submittedAt,
    Double aiConfidence,
    boolean needsReview,
    AiExtractionMethod extractionMethod,
    String errorCode,
    String errorMessage,
    boolean canRetry) {}
