package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.BatchEmailRequest;
import com.tttn.backend_core.dto.response.BatchJobResponse;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.entity.BatchJob;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.BatchJobRepository;
import com.tttn.backend_core.repository.JobRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BatchJobService {

  private final BatchJobRepository batchJobRepository;
  private final JobRepository jobRepository;
  private final com.tttn.backend_core.repository.ApplicationRepository applicationRepository;

  @Transactional
  public String createBatchJob(BatchEmailRequest request, String hrEmail) {
    String batchJobId = UUID.randomUUID().toString();

    java.util.List<com.tttn.backend_core.entity.Application> applications =
        applicationRepository.findAdminApplicationsByIds(request.getApplicationIds());
    if (applications.size() != request.getApplicationIds().size()
        || applications.stream().anyMatch(app -> app.getJob() == null)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    UUID jobId = applications.getFirst().getJob().getId();
    if (applications.stream().anyMatch(app -> !jobId.equals(app.getJob().getId()))) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
    assertJobOwnedByHr(jobId, hrEmail);
    ApplicationStatus requiredStatus =
        "INVITE".equals(request.getAction())
            ? ApplicationStatus.SHORTLISTED
            : ApplicationStatus.REJECTED;
    if (applications.stream().anyMatch(app -> app.getStatus() != requiredStatus)) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
    if ("REJECT".equals(request.getAction())
        && applications.stream().anyMatch(app -> !canReceiveRejectionEmail(app))) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    Map<String, Object> payload = new HashMap<>();
    payload.put("applicationIds", request.getApplicationIds());
    payload.put("jobId", jobId.toString());
    payload.put("action", request.getAction());
    payload.put("subjectTemplate", request.getSubjectTemplate());
    payload.put("bodyTemplate", request.getBodyTemplate());
    java.util.Map<String, String> candidateEmails = new HashMap<>();
    applications.forEach(
        app -> candidateEmails.put(app.getId().toString(), app.getCandidate().getEmail()));
    payload.put("candidateEmails", candidateEmails);
    if ("REJECT".equals(request.getAction())) {
      Map<String, String> careerPathSummaries = new HashMap<>();
      applications.stream()
          .filter(this::hasCandidateCareerPath)
          .forEach(app -> careerPathSummaries.put(app.getId().toString(), formatCareerPath(app)));
      payload.put("careerPathSummaries", careerPathSummaries);
    }

    BatchJob batchJob =
        BatchJob.builder()
            .id(batchJobId)
            .totalCount(request.getApplicationIds().size())
            .status("PENDING")
            .payload(payload)
            .build();

    batchJobRepository.save(batchJob);
    log.info(
        "Batch job created: id={}, totalCount={}", batchJobId, request.getApplicationIds().size());

    return batchJobId;
  }

  @Transactional
  public BatchJobResponse getBatchJobStatus(String batchJobId, String hrEmail) {
    BatchJob batchJob =
        batchJobRepository
            .findById(batchJobId)
            .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
    assertBatchOwnedByHr(batchJob, hrEmail);
    reconcileLegacyBatchProgress(batchJob);
    return toResponse(batchJob);
  }

  @Transactional
  public java.util.List<BatchJobResponse> getBatchHistory(UUID jobId, String hrEmail) {
    assertJobOwnedByHr(jobId, hrEmail);
    return batchJobRepository.findAll().stream()
        .filter(job -> jobId.toString().equals(String.valueOf(job.getPayload().get("jobId"))))
        .peek(this::reconcileLegacyBatchProgress)
        .sorted(java.util.Comparator.comparing(BatchJob::getCreatedAt).reversed())
        .map(this::toResponse)
        .toList();
  }

  private BatchJobResponse toResponse(BatchJob batchJob) {
    return BatchJobResponse.builder()
        .id(batchJob.getId())
        .status(batchJob.getStatus())
        .totalCount(batchJob.getTotalCount())
        .processedCount(batchJob.getProcessedCount())
        .successCount(batchJob.getSuccessCount())
        .failedCount(batchJob.getFailedCount())
        .createdAt(batchJob.getCreatedAt())
        .updatedAt(batchJob.getUpdatedAt())
        .payload(batchJob.getPayload())
        .build();
  }

  private void assertBatchOwnedByHr(BatchJob batchJob, String hrEmail) {
    Object jobId = batchJob.getPayload().get("jobId");
    try {
      assertJobOwnedByHr(UUID.fromString(String.valueOf(jobId)), hrEmail);
    } catch (IllegalArgumentException exception) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
  }

  private void assertJobOwnedByHr(UUID jobId, String hrEmail) {
    boolean owned =
        jobRepository
            .findAdminJobById(jobId)
            .map(job -> job.getHr() != null && hrEmail.equalsIgnoreCase(job.getHr().getEmail()))
            .orElse(false);
    if (!owned) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
  }

  private boolean hasCandidateCareerPath(com.tttn.backend_core.entity.Application application) {
    if (application.getScoringBreakdown() == null) {
      return false;
    }
    Object result = application.getScoringBreakdown().get("career_path_result");
    return result instanceof Map<?, ?> resultMap
        && resultMap.get("candidate_view") instanceof Map<?, ?>;
  }

  private boolean canReceiveRejectionEmail(com.tttn.backend_core.entity.Application application) {
    return hasCandidateCareerPath(application) || hasNoLearnableGapsCareerPath(application);
  }

  private boolean hasNoLearnableGapsCareerPath(
      com.tttn.backend_core.entity.Application application) {
    if (application.getScoringBreakdown() == null) {
      return false;
    }
    Object result = application.getScoringBreakdown().get("career_path_result");
    if (!(result instanceof Map<?, ?> resultMap)
        || !"NOT_APPLICABLE".equals(String.valueOf(resultMap.get("status")))) {
      return false;
    }
    Object diagnostics = resultMap.get("diagnostics");
    return diagnostics instanceof Map<?, ?> diagnosticsMap
        && "NO_LEARNABLE_GAPS".equals(String.valueOf(diagnosticsMap.get("fallback_reason")));
  }

  private String formatCareerPath(com.tttn.backend_core.entity.Application application) {
    Map<?, ?> result = (Map<?, ?>) application.getScoringBreakdown().get("career_path_result");
    Map<?, ?> candidateView = (Map<?, ?>) result.get("candidate_view");
    String summary = stringValue(candidateView.get("summary"));
    String nextAction = stringValue(candidateView.get("next_action"));
    Object growthAreas = candidateView.get("priority_growth_areas");
    StringBuilder content = new StringBuilder("LỘ TRÌNH PHÁT TRIỂN GỢI Ý");
    if (!summary.isBlank()) content.append("\n\n").append(summary);
    if (growthAreas instanceof java.util.List<?> areas && !areas.isEmpty()) {
      content.append("\n\nCác trọng tâm phát triển:");
      areas.stream().limit(3).forEach(area -> content.append("\n• ").append(area));
    }
    if (!nextAction.isBlank()) content.append("\n\nBước đầu tiên: ").append(nextAction);
    return content.toString();
  }

  private String stringValue(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  /**
   * Repairs batches completed by the former scheduler before notification replies updated counters.
   */
  private void reconcileLegacyBatchProgress(BatchJob batchJob) {
    if (!"COMPLETED".equals(batchJob.getStatus())
        || batchJob.getTotalCount() == 0
        || batchJob.getProcessedCount() > 0) {
      return;
    }

    Object rawApplicationIds = batchJob.getPayload().get("applicationIds");
    if (!(rawApplicationIds instanceof java.util.List<?> rawIds)) {
      return;
    }
    java.util.List<UUID> applicationIds;
    try {
      applicationIds =
          rawIds.stream().map(value -> UUID.fromString(String.valueOf(value))).toList();
    } catch (IllegalArgumentException exception) {
      log.warn("Cannot reconcile batch {}: invalid application id payload", batchJob.getId());
      return;
    }
    java.util.Map<UUID, ApplicationStatus> statuses =
        applicationRepository.findAdminApplicationsByIds(applicationIds).stream()
            .collect(
                java.util.stream.Collectors.toMap(
                    com.tttn.backend_core.entity.Application::getId,
                    com.tttn.backend_core.entity.Application::getStatus));
    ApplicationStatus successStatus =
        "INVITE".equals(batchJob.getPayload().get("action"))
            ? ApplicationStatus.INVITED
            : ApplicationStatus.REJECTED_FINAL;
    ApplicationStatus revertedStatus =
        "INVITE".equals(batchJob.getPayload().get("action"))
            ? ApplicationStatus.SHORTLISTED
            : ApplicationStatus.REJECTED;
    int successCount =
        (int) applicationIds.stream().filter(id -> statuses.get(id) == successStatus).count();
    int failedCount =
        (int) applicationIds.stream().filter(id -> statuses.get(id) == revertedStatus).count();
    int processedCount = successCount + failedCount;

    batchJob.setSuccessCount(successCount);
    batchJob.setFailedCount(failedCount);
    batchJob.setProcessedCount(processedCount);
    batchJob.setStatus(processedCount == batchJob.getTotalCount() ? "COMPLETED" : "PROCESSING");
    log.info(
        "Reconciled legacy batch {}: processed={}, success={}, failed={}",
        batchJob.getId(),
        processedCount,
        successCount,
        failedCount);
  }
}
