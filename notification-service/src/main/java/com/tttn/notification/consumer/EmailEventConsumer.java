package com.tttn.notification.consumer;

import com.tttn.notification.entity.EmailJob;
import com.tttn.notification.repository.EmailJobRepository;
import com.tttn.notification.service.EmailService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailEventConsumer {

    private final EmailJobRepository emailJobRepository;
    private final EmailService emailService;
    private final RabbitTemplate rabbitTemplate;

    private static final String REPLY_QUEUE = "core.status.reply.queue";

    @RabbitListener(queues = "notification.email.queue")
    @Transactional
    public void consumeEmailEvent(Map<String, Object> message) {
        String eventId = (String) message.get("eventId");
        String batchJobId = (String) message.get("batchJobId");
        String applicationId = (String) message.get("applicationId");

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) message.get("payload");

        String action = (String) payload.get("action");
        String recipient = (String) payload.get("candidateEmail");
        String subjectTemplate = (String) payload.get("subjectTemplate");
        String bodyTemplate = (String) payload.get("bodyTemplate");

        log.info("Received email task for applicant {} (Event: {})", recipient, eventId);

        // 1. Idempotency Check & Save
        EmailJob job = EmailJob.builder()
                .id(eventId)
                .batchJobId(batchJobId)
                .applicationId(applicationId)
                .recipient(recipient)
                .action(action)
                .status("PROCESSING")
                .build();

        try {
            // If eventId already exists, this will throw DataIntegrityViolationException
            emailJobRepository.saveAndFlush(job);
        } catch (DataIntegrityViolationException e) {
            log.warn("Duplicate message detected for event {}. Ignoring.", eventId);
            return; // Exit early, do not process again
        }

        // 2. Send Email
        String status = "SUCCESS";
        try {
            emailService.sendEmail(recipient, subjectTemplate, bodyTemplate);
            job.setStatus(status);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", recipient, e.getMessage());
            status = "FAILED";
            job.setStatus(status);
            job.setErrorMessage(e.getMessage());
        }

        // Save final status
        emailJobRepository.save(job);

        // 3. Saga Reply back to Core
        Map<String, String> reply = new HashMap<>();
        reply.put("applicationId", applicationId);
        reply.put("batchJobId", batchJobId);
        reply.put("action", action);
        reply.put("status", status);

        rabbitTemplate.convertAndSend(REPLY_QUEUE, reply);
        log.info("Published reply {} to {} for application {}", status, REPLY_QUEUE, applicationId);
    }
}
