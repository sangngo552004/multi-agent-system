package com.tttn.backend_core.job;

import com.tttn.backend_core.config.RabbitMQConfig;
import com.tttn.backend_core.entity.OutboxEvent;
import com.tttn.backend_core.repository.OutboxEventRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxPollerJob {

  private final OutboxEventRepository outboxEventRepository;
  private final RabbitTemplate rabbitTemplate;

  @Scheduled(fixedDelay = 5000) // Poll every 5 seconds
  @Transactional
  public void pollOutboxEvents() {
    // Query locked rows to prevent multiple instances from picking the same events
    List<OutboxEvent> events = outboxEventRepository.findNewEventsForProcessing();

    if (events.isEmpty()) {
      return;
    }

    log.info("Outbox Poller picked up {} events", events.size());

    for (OutboxEvent event : events) {
      try {
        // Wrap the event details and payload into a single message
        Map<String, Object> message = new HashMap<>();
        message.put("eventId", event.getId());
        message.put("batchJobId", event.getBatchJobId());
        message.put("applicationId", event.getApplicationId());
        message.put("payload", event.getPayload());

        // Publish to RabbitMQ
        rabbitTemplate.convertAndSend(RabbitMQConfig.EMAIL_QUEUE, message);

        // Mark as PUBLISHED
        event.setStatus("PUBLISHED");
      } catch (Exception e) {
        log.error("Failed to publish outbox event {}: {}", event.getId(), e.getMessage());
        // Leave status as NEW so it will be retried in the next poll cycle
      }
    }

    // Save the updated statuses.
    // Note: Because this is inside @Transactional, JPA dirty checking will also auto-save,
    // but explicit saveAll is fine too.
    outboxEventRepository.saveAll(events);
  }
}
