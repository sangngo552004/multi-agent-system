package com.tttn.backend_core.job;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.BatchJobRepository;
import com.tttn.backend_core.repository.OutboxEventRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationReplyListener {

  private final ObjectMapper objectMapper;
  private final ApplicationRepository applicationRepository;
  private final BatchJobRepository batchJobRepository;
  private final OutboxEventRepository outboxEventRepository;

  public record ReplyMessage(
      String eventId, String applicationId, String batchJobId, String action, String status) {}

  // Spring AMQP native batching: Receives up to 500 messages at once
  @RabbitListener(queues = "core.status.reply.queue")
  @Transactional
  public void handleReplyBatch(List<Message> messages) {
    log.info("Received batch of {} reply messages from RabbitMQ", messages.size());

    List<UUID> invitedIds = new ArrayList<>();
    List<UUID> rejectedFinalIds = new ArrayList<>();
    List<UUID> failedInviteIds = new ArrayList<>();
    List<UUID> failedRejectIds = new ArrayList<>();
    List<ReplyMessage> acceptedReplies = new ArrayList<>();

    for (Message msg : messages) {
      try {
        ReplyMessage reply = objectMapper.readValue(msg.getBody(), ReplyMessage.class);
        if (!markOutboxEventDelivered(reply)) {
          continue;
        }
        acceptedReplies.add(reply);
        if ("SUCCESS".equals(reply.status())) {
          if ("INVITE".equals(reply.action())) {
            invitedIds.add(UUID.fromString(reply.applicationId()));
          } else if ("REJECT".equals(reply.action())) {
            rejectedFinalIds.add(UUID.fromString(reply.applicationId()));
          }
        } else if ("INVITE".equals(reply.action())) {
          failedInviteIds.add(UUID.fromString(reply.applicationId()));
        } else if ("REJECT".equals(reply.action())) {
          failedRejectIds.add(UUID.fromString(reply.applicationId()));
        }
      } catch (Exception e) {
        log.error("Failed to parse reply message: {}", e.getMessage());
      }
    }

    if (!invitedIds.isEmpty()) {
      applicationRepository.updateStatusBatch(invitedIds, ApplicationStatus.INVITED);
      applicationRepository.updateIsCandidateNotifiedBatch(invitedIds, true);
      log.info("Updated {} applications to INVITED", invitedIds.size());
    }

    if (!rejectedFinalIds.isEmpty()) {
      applicationRepository.updateStatusBatch(rejectedFinalIds, ApplicationStatus.REJECTED_FINAL);
      applicationRepository.updateIsCandidateNotifiedBatch(rejectedFinalIds, true);
      log.info("Updated {} applications to REJECTED_FINAL", rejectedFinalIds.size());
    }

    if (!failedInviteIds.isEmpty()) {
      applicationRepository.updateStatusBatch(failedInviteIds, ApplicationStatus.SHORTLISTED);
      log.info(
          "Reverted {} invite applications back to SHORTLISTED due to email failure",
          failedInviteIds.size());
    }
    if (!failedRejectIds.isEmpty()) {
      applicationRepository.updateStatusBatch(failedRejectIds, ApplicationStatus.REJECTED);
      log.info(
          "Reverted {} rejected applications back to REJECTED due to email failure",
          failedRejectIds.size());
    }

    acceptedReplies.forEach(this::updateBatchProgress);
  }

  private boolean markOutboxEventDelivered(ReplyMessage reply) {
    if (reply.eventId() == null || reply.eventId().isBlank()) {
      log.warn(
          "Reply without event id for application {}; using legacy batch/application lookup",
          reply.applicationId());
      return outboxEventRepository
          .findByBatchJobIdAndApplicationId(reply.batchJobId(), reply.applicationId())
          .filter(event -> "PUBLISHED".equals(event.getStatus()))
          .map(
              event -> {
                event.setStatus("DELIVERED");
                return true;
              })
          .orElse(false);
    }
    return outboxEventRepository
        .findById(reply.eventId())
        .filter(event -> "PUBLISHED".equals(event.getStatus()))
        .map(
            event -> {
              event.setStatus("DELIVERED");
              return true;
            })
        .orElse(false);
  }

  private void updateBatchProgress(ReplyMessage reply) {
    batchJobRepository
        .findById(reply.batchJobId())
        .ifPresent(
            batchJob -> {
              batchJob.setProcessedCount(batchJob.getProcessedCount() + 1);
              if ("SUCCESS".equals(reply.status())) {
                batchJob.setSuccessCount(batchJob.getSuccessCount() + 1);
              } else {
                batchJob.setFailedCount(batchJob.getFailedCount() + 1);
              }
              if (batchJob.getProcessedCount() >= batchJob.getTotalCount()) {
                batchJob.setStatus("COMPLETED");
              }
            });
  }
}
