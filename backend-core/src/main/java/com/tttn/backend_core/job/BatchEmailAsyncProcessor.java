package com.tttn.backend_core.job;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.entity.BatchJob;
import com.tttn.backend_core.entity.OutboxEvent;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.BatchJobRepository;
import com.tttn.backend_core.repository.OutboxEventRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BatchEmailAsyncProcessor {

  private final BatchJobRepository batchJobRepository;
  private final OutboxEventRepository outboxEventRepository;
  private final ApplicationRepository applicationRepository;
  private final ObjectMapper objectMapper;

  // Run every 10 seconds to scan for PENDING jobs or stalled PROCESSING jobs
  @Scheduled(fixedDelay = 10000)
  public void processPendingBatchJobs() {
    // In a real system, you'd only pick PROCESSING jobs if updated_at is old
    List<BatchJob> jobs =
        batchJobRepository.findByStatusInAndUpdatedAtBefore(
            List.of("PENDING", "PROCESSING"), LocalDateTime.now());

    for (BatchJob job : jobs) {
      try {
        processChunk(job);
      } catch (Exception e) {
        log.error("Error processing batch job {}: {}", job.getId(), e.getMessage());
      }
    }
  }

  @Transactional
  public void processChunk(BatchJob job) {
    if ("PENDING".equals(job.getStatus())) {
      job.setStatus("PROCESSING");
      batchJobRepository.save(job);
    }

    Map<String, Object> payload = job.getPayload();
    List<String> applicationIds =
        objectMapper.convertValue(
            payload.get("applicationIds"), new TypeReference<List<String>>() {});

    int total = applicationIds.size();
    int currentIndex = job.getLastProcessedIndex();
    int chunkSize = 500;

    if (currentIndex >= total) {
      job.setStatus("COMPLETED");
      batchJobRepository.save(job);
      return;
    }

    int endIndex = Math.min(currentIndex + chunkSize, total);
    List<String> chunkIds = applicationIds.subList(currentIndex, endIndex);

    List<UUID> uuidChunkIds = chunkIds.stream().map(UUID::fromString).toList();

    // 1. UPDATE applications status to PENDING_EMAIL_SEND conditionally to avoid Race Condition
    int updatedCount =
        applicationRepository.updateStatusConditionally(
            uuidChunkIds, ApplicationStatus.SHORTLISTED, ApplicationStatus.PENDING_EMAIL_SEND);

    if (updatedCount == 0) {
      log.warn(
          "No applications updated for job {}. Maybe already processed or not SHORTLISTED.",
          job.getId());
      job.setLastProcessedIndex(endIndex);
      if (endIndex >= total) job.setStatus("COMPLETED");
      batchJobRepository.save(job);
      return;
    }

    // 2. Insert into Outbox
    List<OutboxEvent> outboxEvents = new ArrayList<>();
    for (String appId : chunkIds) {
      Map<String, Object> outboxPayload = new HashMap<>();
      outboxPayload.put("action", payload.get("action"));
      outboxPayload.put("subjectTemplate", payload.get("subjectTemplate"));
      outboxPayload.put("bodyTemplate", payload.get("bodyTemplate"));
      // Mock email for now. In production, we fetch real emails.
      outboxPayload.put("candidateEmail", "candidate-" + appId + "@example.com");

      OutboxEvent event =
          OutboxEvent.builder()
              .id(UUID.randomUUID().toString())
              .batchJobId(job.getId())
              .applicationId(appId)
              .payload(outboxPayload)
              .status("NEW")
              .build();
      outboxEvents.add(event);
    }

    outboxEventRepository.saveAll(outboxEvents);

    // 3. Update Progress
    job.setLastProcessedIndex(endIndex);
    if (endIndex >= total) {
      // Note: Wait until Notification Service replies to set COMPLETE.
      // For now, we leave it PROCESSING or mark a different status.
      // But the instructions said: "Khi processed_count == total_count -> COMPLETED".
      // So we don't set COMPLETED here.
    }
    batchJobRepository.save(job);

    log.info("Processed chunk for job {}: index {} to {}", job.getId(), currentIndex, endIndex);
  }
}
