package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.AiExtractionMethod;
import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.entity.AiStepName;
import com.tttn.backend_core.entity.AiStepStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminApplicationDetailResponse(
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
    boolean canRetry,
    CandidateSummary candidate,
    JobSummary job,
    List<PipelineStep> pipeline,
    int warningCount) {

  public record CandidateSummary(UUID id, String fullName) {}

  public record JobSummary(UUID id, String title, String departmentName) {}

  public record PipelineStep(
      AiStepName id,
      String label,
      AiStepStatus status,
      String message,
      LocalDateTime startedAt,
      LocalDateTime finishedAt) {}
}
