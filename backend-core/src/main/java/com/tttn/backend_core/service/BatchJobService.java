package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.BatchEmailRequest;
import com.tttn.backend_core.entity.BatchJob;
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

  @Transactional
  public String createBatchJob(BatchEmailRequest request) {
    String batchJobId = UUID.randomUUID().toString();

    Map<String, Object> payload = new HashMap<>();
    payload.put("applicationIds", request.getApplicationIds());
    payload.put("action", request.getAction());
    payload.put("subjectTemplate", request.getSubjectTemplate());
    payload.put("bodyTemplate", request.getBodyTemplate());

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
}
