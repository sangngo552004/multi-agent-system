package com.tttn.backend_core.job;

import com.tttn.backend_core.config.RabbitMQConfig;
import com.tttn.backend_core.entity.AiProcessingOutbox;
import com.tttn.backend_core.repository.AiProcessingOutboxRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiProcessingOutboxPublisher {

  private final AiProcessingOutboxRepository outboxRepository;
  private final RabbitTemplate rabbitTemplate;

  @Scheduled(fixedDelayString = "${ai.processing.outbox-delay-ms:1000}")
  @Transactional
  public void publishPending() {
    List<AiProcessingOutbox> events = outboxRepository.findNewForPublishing();
    for (AiProcessingOutbox event : events) {
      try {
        rabbitTemplate.convertAndSend(RabbitMQConfig.APPLICATION_PROCESS_QUEUE, event.getPayload());
        event.setStatus("PUBLISHED");
        event.setPublishedAt(LocalDateTime.now());
      } catch (RuntimeException exception) {
        log.warn("Unable to publish AI run {}. It will be retried.", event.getRunId());
      }
    }
  }
}
