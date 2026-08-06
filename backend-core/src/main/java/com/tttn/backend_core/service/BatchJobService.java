package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.BatchEmailRequest;
import com.tttn.backend_core.dto.response.BatchJobResponse;
import com.tttn.backend_core.entity.BatchJob;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.BatchJobRepository;
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
  private final com.tttn.backend_core.repository.ApplicationRepository applicationRepository;

  @Transactional
  public String createBatchJob(BatchEmailRequest request, String hrEmail) {
    String batchJobId = UUID.randomUUID().toString();

    java.util.List<com.tttn.backend_core.entity.Application> applications =
        applicationRepository.findAdminApplicationsByIds(request.getApplicationIds());
    if (applications.size() != request.getApplicationIds().size()
        || applications.stream()
            .anyMatch(
                app ->
                    app.getJob() == null
                        || app.getJob().getHr() == null
                        || !hrEmail.equalsIgnoreCase(app.getJob().getHr().getEmail()))) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    Map<String, Object> payload = new HashMap<>();
    payload.put("applicationIds", request.getApplicationIds());
    payload.put("action", request.getAction());
    payload.put("subjectTemplate", request.getSubjectTemplate());
    payload.put("bodyTemplate", request.getBodyTemplate());
    java.util.Map<String, String> candidateEmails = new HashMap<>();
    applications.forEach(
        app -> candidateEmails.put(app.getId().toString(), app.getCandidate().getEmail()));
    payload.put("candidateEmails", candidateEmails);

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

  @Transactional(readOnly = true)
  public BatchJobResponse getBatchJobStatus(String batchJobId, String hrEmail) {
    BatchJob batchJob =
        batchJobRepository
            .findById(batchJobId)
            .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
    @SuppressWarnings("unchecked")
    java.util.List<String> ids =
        (java.util.List<String>)
            batchJob.getPayload().getOrDefault("applicationIds", java.util.List.of());
    java.util.List<UUID> applicationIds = ids.stream().map(UUID::fromString).toList();
    java.util.List<com.tttn.backend_core.entity.Application> applications =
        applicationRepository.findAdminApplicationsByIds(applicationIds);
    if (applications.size() != applicationIds.size()
        || applications.stream()
            .anyMatch(
                app ->
                    app.getJob() == null
                        || app.getJob().getHr() == null
                        || !hrEmail.equalsIgnoreCase(app.getJob().getHr().getEmail()))) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    return BatchJobResponse.builder()
        .id(batchJob.getId())
        .status(batchJob.getStatus())
        .totalCount(batchJob.getTotalCount())
        .processedCount(batchJob.getProcessedCount())
        .successCount(batchJob.getSuccessCount())
        .failedCount(batchJob.getFailedCount())
        .payload(batchJob.getPayload())
        .build();
  }
}
