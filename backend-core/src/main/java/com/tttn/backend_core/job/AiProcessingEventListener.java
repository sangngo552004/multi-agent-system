package com.tttn.backend_core.job;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tttn.backend_core.config.RabbitMQConfig;
import com.tttn.backend_core.entity.*;
import com.tttn.backend_core.repository.*;
import com.tttn.backend_core.service.ActivityLogService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Arrays;
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
public class AiProcessingEventListener {

  private final ObjectMapper objectMapper;
  private final AiProcessedEventRepository processedEventRepository;
  private final AiProcessingRunRepository runRepository;
  private final AiProcessingStepRepository stepRepository;
  private final ApplicationRepository applicationRepository;
  private final CandidateProfileRepository candidateProfileRepository;
  private final ActivityLogService activityLogService;

  @RabbitListener(queues = RabbitMQConfig.APPLICATION_EVENT_QUEUE)
  @Transactional
  public void handleEvents(List<Message> messages) {
    for (Message message : messages) {
      try {
        handleEvent(objectMapper.readTree(message.getBody()));
      } catch (Exception exception) {
        log.error(
            "Rejected invalid AI processing event: {}",
            new String(message.getBody(), StandardCharsets.UTF_8).length());
      }
    }
  }

  private void handleEvent(JsonNode event) {
    String eventId = requiredText(event, "eventId");
    if (processedEventRepository.existsById(eventId)) {
      return;
    }
    UUID runId = UUID.fromString(requiredText(event, "runId"));
    UUID applicationId = UUID.fromString(requiredText(event, "applicationId"));
    AiProcessingRun run =
        runRepository
            .findById(runId)
            .orElseThrow(() -> new IllegalArgumentException("Unknown AI run"));
    if (!run.getApplication().getId().equals(applicationId)) {
      throw new IllegalArgumentException("AI run does not belong to application");
    }
    Application application = run.getApplication();
    LocalDateTime occurredAt = occurredAt(event.path("occurredAt").asText(null));
    String eventType = requiredText(event, "type");

    switch (eventType) {
      case "STEP_STARTED" ->
          startStep(run, application, stepName(event), message(event), occurredAt);
      case "STEP_COMPLETED" ->
          completeStep(run, application, stepName(event), message(event), occurredAt, event);
      case "STEP_SKIPPED" -> skipStep(run, stepName(event), message(event));
      case "RUN_COMPLETED" -> completeRun(run, application, occurredAt, event);
      case "RUN_FAILED" -> failRun(run, application, occurredAt, event);
      default -> throw new IllegalArgumentException("Unknown AI event type");
    }
    processedEventRepository.save(AiProcessedEvent.builder().eventId(eventId).runId(runId).build());
  }

  private void startStep(
      AiProcessingRun run,
      Application application,
      AiStepName name,
      String message,
      LocalDateTime occurredAt) {
    AiProcessingStep step = findStep(run, name);
    step.setStatus(AiStepStatus.ACTIVE);
    step.setMessage(message);
    step.setStartedAt(occurredAt);
    run.setStatus(AiProcessingStatus.PROCESSING);
    if (run.getStartedAt() == null) {
      run.setStartedAt(occurredAt);
    }
    application.setAiStatus(AiProcessingStatus.PROCESSING);
  }

  private void completeStep(
      AiProcessingRun run,
      Application application,
      AiStepName name,
      String message,
      LocalDateTime occurredAt,
      JsonNode event) {
    AiProcessingStep step = findStep(run, name);
    step.setStatus(AiStepStatus.COMPLETED);
    step.setMessage(message);
    if (step.getStartedAt() == null) {
      step.setStartedAt(occurredAt);
    }
    step.setFinishedAt(occurredAt);
    if (name == AiStepName.EXTRACTION) {
      updateMetrics(application, event);
      // Events use camelCase like the Core -> AI command. Accept the previous
      // snake_case spelling during a rolling deployment.
      JsonNode cvDataNode = event.hasNonNull("cvData") ? event.get("cvData") : event.get("cv_data");
      if (cvDataNode != null && !cvDataNode.isNull()) {
        java.util.Map<String, Object> cvData =
            objectMapper.convertValue(cvDataNode, java.util.Map.class);

        // If this is a Job Application (job != null), we only store the cv_data in
        // scoringBreakdown.
        // We DO NOT update the CandidateProfile to avoid overwriting their master data.
        if (application.getJob() != null) {
          java.util.Map<String, Object> breakdown = application.getScoringBreakdown();
          if (breakdown == null) {
            breakdown = new java.util.HashMap<>();
          }
          breakdown.put("extracted_cv_data", cvData);
          application.setScoringBreakdown(breakdown);
          applicationRepository.save(application);
        } else {
          // Master Profile Upload (job == null): Update CandidateProfile
          CandidateProfile profile =
              candidateProfileRepository
                  .findById(application.getCandidate().getId())
                  .orElseGet(
                      () -> CandidateProfile.builder().user(application.getCandidate()).build());

          profile.setCvUrl(application.getResumeUrl());
          profile.setRawCvData(cvData);
          profile.setProfileData(profileDataFromCv(cvData));

          candidateProfileRepository.save(profile);
        }
      }
    }
    if (name == AiStepName.MATCHING && event.hasNonNull("matchResult")) {
      java.util.Map<String, Object> breakdown = application.getScoringBreakdown();
      if (breakdown == null) {
        breakdown = new java.util.HashMap<>();
      }
      // Keep the complete result (evidence matrix, recommendation, criteria
      // and deterministic score breakdown) so a score is explainable to HR.
      breakdown.put(
          "matching_result",
          objectMapper.convertValue(event.get("matchResult"), java.util.Map.class));
      application.setScoringBreakdown(breakdown);
      applicationRepository.save(application);
    }
  }

  private void completeRun(
      AiProcessingRun run, Application application, LocalDateTime occurredAt, JsonNode event) {
    AiProcessingStep completed = findStep(run, AiStepName.COMPLETED);
    completed.setStatus(AiStepStatus.COMPLETED);
    completed.setMessage(message(event));
    completed.setStartedAt(
        completed.getStartedAt() == null ? occurredAt : completed.getStartedAt());
    completed.setFinishedAt(occurredAt);
    run.setStatus(AiProcessingStatus.COMPLETED);
    run.setCompletedAt(occurredAt);
    run.setErrorCode(null);
    run.setErrorMessage(null);
    application.setAiStatus(AiProcessingStatus.COMPLETED);
    application.setAiErrorCode(null);
    application.setAiErrorMessage(null);
    updateMetrics(application, event);
    if (event.hasNonNull("matchScore")) {
      application.setFitScore(event.get("matchScore").asDouble());
    }
    if (event.hasNonNull("careerPathResult")) {
      java.util.Map<String, Object> scoringBreakdown = application.getScoringBreakdown();
      if (scoringBreakdown == null) {
        scoringBreakdown = new java.util.HashMap<>();
      }
      scoringBreakdown.put(
          "career_path_result",
          objectMapper.convertValue(event.get("careerPathResult"), java.util.Map.class));
      application.setScoringBreakdown(scoringBreakdown);
    }
    if (run.getTrigger() == AiRunTrigger.HR_REJECTION
        && application.getStatus() == ApplicationStatus.REJECTED) {
      application.setIsCandidateNotified(true);
    }
    activityLogService.recordAiProcessingTerminal(
        application.getId(), application.getCandidate().getFullName(), true, null);
  }

  private void skipStep(AiProcessingRun run, AiStepName name, String message) {
    AiProcessingStep step = findStep(run, name);
    step.setStatus(AiStepStatus.SKIPPED);
    step.setMessage(message);
  }

  private void failRun(
      AiProcessingRun run, Application application, LocalDateTime occurredAt, JsonNode event) {
    String errorCode = event.path("errorCode").asText("AI_PROCESSING_FAILED");
    String errorMessage = event.path("errorMessage").asText("AI processing failed.");
    AiStepName failedName =
        event.hasNonNull("step") ? AiStepName.valueOf(event.get("step").asText()) : null;
    if (failedName != null) {
      AiProcessingStep failed = findStep(run, failedName);
      failed.setStatus(AiStepStatus.FAILED);
      failed.setMessage(errorMessage);
      failed.setStartedAt(failed.getStartedAt() == null ? occurredAt : failed.getStartedAt());
      failed.setFinishedAt(occurredAt);
      Arrays.stream(AiStepName.values())
          .filter(name -> name.ordinal() > failedName.ordinal())
          .map(name -> findStep(run, name))
          .filter(step -> step.getStatus() == AiStepStatus.PENDING)
          .forEach(
              step -> {
                step.setStatus(AiStepStatus.SKIPPED);
                step.setMessage("Không chạy do bước trước thất bại.");
              });
    }
    run.setStatus(AiProcessingStatus.FAILED);
    run.setCompletedAt(occurredAt);
    run.setErrorCode(errorCode);
    run.setErrorMessage(errorMessage);
    application.setAiStatus(AiProcessingStatus.FAILED);
    application.setAiErrorCode(errorCode);
    application.setAiErrorMessage(errorMessage);
    if (run.getTrigger() == AiRunTrigger.HR_REJECTION
        && application.getStatus() == ApplicationStatus.REJECTED) {
      application.setIsCandidateNotified(true);
    }
    updateMetrics(application, event);
    activityLogService.recordAiProcessingTerminal(
        application.getId(), application.getCandidate().getFullName(), false, errorCode);
  }

  private java.util.Map<String, Object> profileDataFromCv(java.util.Map<String, Object> rawCvData) {
    java.util.Map<String, Object> profileData = new java.util.LinkedHashMap<>();
    java.util.List<String> profileFields =
        java.util.List.of(
            "personal_info",
            "social_links",
            "professional_metadata",
            "skills",
            "experience",
            "education",
            "projects",
            "spoken_languages",
            "certifications");
    profileFields.forEach(
        field -> {
          if (rawCvData.containsKey(field)) {
            profileData.put(field, rawCvData.get(field));
          }
        });
    return profileData;
  }

  private void updateMetrics(Application application, JsonNode event) {
    if (event.hasNonNull("aiConfidence")) {
      application.setAiConfidence(event.get("aiConfidence").asDouble());
    }
    if (event.hasNonNull("needsReview")) {
      application.setNeedsReview(event.get("needsReview").asBoolean());
    }
    if (event.hasNonNull("warningCount")) {
      application.setAiWarningCount(Math.max(0, event.get("warningCount").asInt()));
    }
    if (event.hasNonNull("extractionMethod")) {
      application.setExtractionMethod(
          AiExtractionMethod.valueOf(event.get("extractionMethod").asText()));
    }
    applicationRepository.save(application);
  }

  private AiProcessingStep findStep(AiProcessingRun run, AiStepName name) {
    return stepRepository
        .findByRun_IdAndStepName(run.getId(), name)
        .orElseThrow(() -> new IllegalArgumentException("Unknown AI step"));
  }

  private AiStepName stepName(JsonNode event) {
    return AiStepName.valueOf(requiredText(event, "step"));
  }

  private String message(JsonNode event) {
    return event.path("message").asText("AI processing state updated.");
  }

  private String requiredText(JsonNode event, String field) {
    String value = event.path(field).asText(null);
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Missing event field");
    }
    return value;
  }

  private LocalDateTime occurredAt(String value) {
    if (value == null || value.isBlank()) {
      return LocalDateTime.now();
    }
    try {
      return OffsetDateTime.parse(value).toLocalDateTime();
    } catch (java.time.format.DateTimeParseException ignored) {
      return LocalDateTime.parse(value);
    }
  }
}
