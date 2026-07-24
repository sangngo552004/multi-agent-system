package com.tttn.backend_core.job;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.repository.ApplicationRepository;
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

  public record ReplyMessage(
      String applicationId, String batchJobId, String action, String status) {}

  // Spring AMQP native batching: Receives up to 500 messages at once
  @RabbitListener(queues = "core.status.reply.queue")
  @Transactional
  public void handleReplyBatch(List<Message> messages) {
    log.info("Received batch of {} reply messages from RabbitMQ", messages.size());

    List<UUID> invitedIds = new ArrayList<>();
    List<UUID> rejectedFinalIds = new ArrayList<>();
    List<UUID> failedIds = new ArrayList<>();

    for (Message msg : messages) {
      try {
        ReplyMessage reply = objectMapper.readValue(msg.getBody(), ReplyMessage.class);
        if ("SUCCESS".equals(reply.status())) {
          if ("INVITE".equals(reply.action())) {
            invitedIds.add(UUID.fromString(reply.applicationId()));
          } else if ("REJECT".equals(reply.action())) {
            rejectedFinalIds.add(UUID.fromString(reply.applicationId()));
          }
        } else {
          failedIds.add(UUID.fromString(reply.applicationId()));
        }
      } catch (Exception e) {
        log.error("Failed to parse reply message: {}", e.getMessage());
      }
    }

    if (!invitedIds.isEmpty()) {
      applicationRepository.updateStatusBatch(invitedIds, ApplicationStatus.INVITED);
      log.info("Updated {} applications to INVITED", invitedIds.size());
    }

    if (!rejectedFinalIds.isEmpty()) {
      applicationRepository.updateStatusBatch(rejectedFinalIds, ApplicationStatus.REJECTED_FINAL);
      log.info("Updated {} applications to REJECTED_FINAL", rejectedFinalIds.size());
    }

    if (!failedIds.isEmpty()) {
      applicationRepository.updateStatusBatch(failedIds, ApplicationStatus.SHORTLISTED);
      log.info(
          "Reverted {} applications back to SHORTLISTED due to email failure", failedIds.size());
    }
  }
}
