package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.response.ApplicationResponse;
import com.tttn.backend_core.entity.Application;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationService {

  private final ApplicationRepository applicationRepository;
  private final com.tttn.backend_core.repository.JobRepository jobRepository;
  private final com.tttn.backend_core.repository.UserRepository userRepository;
  private final StorageService storageService;
  private final com.tttn.backend_core.repository.AiProcessingOutboxRepository outboxRepository;
  private final com.tttn.backend_core.repository.AiProcessingRunRepository runRepository;
  private final com.tttn.backend_core.repository.AiProcessingStepRepository stepRepository;
  private final com.tttn.backend_core.mapper.ApplicationMapper applicationMapper;
  private final com.tttn.backend_core.repository.CandidateProfileRepository
      candidateProfileRepository;

  @Transactional(readOnly = true)
  public Page<ApplicationResponse> getApplicationsByJob(
      UUID jobId,
      ApplicationStatus status,
      com.tttn.backend_core.entity.AiProcessingStatus aiStatus,
      Boolean needsReview,
      Pageable pageable,
      String hrEmail) {

    org.springframework.data.jpa.domain.Specification<Application> spec =
        (root, query, cb) -> {
          java.util.List<jakarta.persistence.criteria.Predicate> predicates =
              new java.util.ArrayList<>();
          predicates.add(cb.equal(root.get("job").get("id"), jobId));
          predicates.add(cb.equal(root.join("job").join("hr").get("email"), hrEmail));

          if (status != null) {
            predicates.add(cb.equal(root.get("status"), status));
          }
          if (aiStatus != null) {
            predicates.add(cb.equal(root.get("aiStatus"), aiStatus));
          }
          if (needsReview != null) {
            predicates.add(cb.equal(root.get("needsReview"), needsReview));
          }

          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

    return applicationRepository.findAll(spec, pageable).map(applicationMapper::toResponse);
  }

  @Transactional(readOnly = true)
  public Page<ApplicationResponse> findForHr(
      String hrEmail,
      UUID jobId,
      ApplicationStatus status,
      com.tttn.backend_core.entity.AiProcessingStatus aiStatus,
      Boolean needsReview,
      String search,
      Pageable pageable) {
    org.springframework.data.jpa.domain.Specification<Application> spec =
        (root, query, cb) -> {
          java.util.List<jakarta.persistence.criteria.Predicate> predicates =
              new java.util.ArrayList<>();
          predicates.add(cb.equal(root.join("job").join("hr").get("email"), hrEmail));
          if (jobId != null) predicates.add(cb.equal(root.get("job").get("id"), jobId));
          if (status != null) predicates.add(cb.equal(root.get("status"), status));
          if (aiStatus != null) predicates.add(cb.equal(root.get("aiStatus"), aiStatus));
          if (needsReview != null) predicates.add(cb.equal(root.get("needsReview"), needsReview));
          if (search != null && !search.isBlank()) {
            String value = "%" + search.trim().toLowerCase(java.util.Locale.ROOT) + "%";
            predicates.add(
                cb.or(
                    cb.like(cb.lower(root.join("candidate").get("fullName")), value),
                    cb.like(cb.lower(root.join("candidate").get("email")), value),
                    cb.like(cb.lower(root.join("job").get("title")), value)));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    return applicationRepository.findAll(spec, pageable).map(applicationMapper::toResponse);
  }

  @Transactional(readOnly = true)
  public ApplicationResponse getApplicationDetail(UUID id) {
    Application app =
        applicationRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

    return applicationMapper.toResponse(app);
  }

  @Transactional(readOnly = true)
  public ApplicationResponse getApplicationDetail(UUID id, String hrEmail) {
    Application application = findForHr(id, hrEmail);
    var breakdown = application.getScoringBreakdown();
    log.info(
        "HR application detail loaded: applicationId={}, aiStatus={}, breakdownKeys={}, hasExtractedCv={}, hasMatchingResult={}, evidenceCount={}, matchStatus={}, rejectionReason={}",
        id,
        application.getAiStatus(),
        breakdown == null ? java.util.Set.of() : breakdown.keySet(),
        breakdown != null && breakdown.containsKey("extracted_cv_data"),
        breakdown != null && breakdown.containsKey("matching_result"),
        evidenceCount(breakdown),
        matchingValue(breakdown, "status"),
        matchingValue(breakdown, "rejection_reason"));
    return applicationMapper.toResponse(application);
  }

  private int evidenceCount(java.util.Map<String, Object> breakdown) {
    Object matching = breakdown == null ? null : breakdown.get("matching_result");
    if (!(matching instanceof java.util.Map<?, ?> matchingMap)) {
      return 0;
    }
    Object evidence = matchingMap.get("evidence_matrix");
    return evidence instanceof java.util.Collection<?> collection ? collection.size() : 0;
  }

  private Object matchingValue(java.util.Map<String, Object> breakdown, String key) {
    Object matching = breakdown == null ? null : breakdown.get("matching_result");
    return matching instanceof java.util.Map<?, ?> matchingMap ? matchingMap.get(key) : null;
  }

  @Transactional
  public void approveApplication(UUID id, String hrEmail) {
    Application application = findForHr(id, hrEmail);

    application.setStatus(ApplicationStatus.SHORTLISTED);
    applicationRepository.save(application);
    log.info("Application {} approved (Status -> SHORTLISTED)", id);
  }

  @Transactional
  public void rejectApplication(UUID id, String hrEmail) {
    Application application = findForHr(id, hrEmail);

    application.setStatus(ApplicationStatus.REJECTED);
    application.setIsCandidateNotified(false);
    applicationRepository.save(application);
    if (!hasActiveAiRun(application.getId())) {
      createAiProcessingTask(
          application,
          com.tttn.backend_core.entity.AiRunTrigger.HR_REJECTION,
          application.getJob().getHr(),
          true);
    } else {
      log.info(
          "Application {} was rejected while AI was active; Career Path will be recovered after the active run",
          id);
    }
    log.info("Application {} rejected (Status -> REJECTED)", id);
  }

  @Transactional
  public void retryCareerPath(UUID id, String hrEmail) {
    Application application = findForHr(id, hrEmail);
    if (application.getStatus() != ApplicationStatus.REJECTED
        || hasCandidateCareerPath(application)
        || hasNoLearnableGapsCareerPath(application)
        || hasActiveAiRun(application.getId())) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
    application.setIsCandidateNotified(false);
    createAiProcessingTask(
        application,
        com.tttn.backend_core.entity.AiRunTrigger.HR_REJECTION,
        application.getJob().getHr(),
        true);
    log.info("Career Path retry requested for rejected application {}", id);
  }

  private boolean hasCandidateCareerPath(Application application) {
    if (application.getScoringBreakdown() == null) {
      return false;
    }
    Object result = application.getScoringBreakdown().get("career_path_result");
    return result instanceof java.util.Map<?, ?> map && map.get("candidate_view") != null;
  }

  private boolean hasNoLearnableGapsCareerPath(Application application) {
    if (application.getScoringBreakdown() == null) {
      return false;
    }
    Object result = application.getScoringBreakdown().get("career_path_result");
    if (!(result instanceof java.util.Map<?, ?> resultMap)
        || !"NOT_APPLICABLE".equals(String.valueOf(resultMap.get("status")))) {
      return false;
    }
    Object diagnostics = resultMap.get("diagnostics");
    return diagnostics instanceof java.util.Map<?, ?> diagnosticsMap
        && "NO_LEARNABLE_GAPS".equals(String.valueOf(diagnosticsMap.get("fallback_reason")));
  }

  private boolean hasActiveAiRun(UUID applicationId) {
    return runRepository.existsByApplication_IdAndStatusIn(
        applicationId,
        java.util.List.of(
            com.tttn.backend_core.entity.AiProcessingStatus.WAITING,
            com.tttn.backend_core.entity.AiProcessingStatus.PROCESSING));
  }

  private Application findForHr(UUID id, String hrEmail) {
    Application application =
        applicationRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
    if (application.getJob() == null
        || application.getJob().getHr() == null
        || !hrEmail.equalsIgnoreCase(application.getJob().getHr().getEmail())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    return application;
  }

  @Transactional
  public ApplicationResponse applyForJob(
      UUID jobId, UUID candidateId, org.springframework.web.multipart.MultipartFile cvFile) {
    com.tttn.backend_core.entity.Job job =
        jobRepository.findById(jobId).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

    com.tttn.backend_core.entity.User candidate =
        userRepository
            .findById(candidateId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    String resumeUrl = storageService.uploadFile(cvFile);

    Application application =
        Application.builder()
            .candidate(candidate)
            .job(job)
            .resumeUrl(resumeUrl)
            .status(ApplicationStatus.PENDING)
            .aiStatus(com.tttn.backend_core.entity.AiProcessingStatus.WAITING)
            .isCandidateNotified(false)
            .build();

    application = applicationRepository.save(application);
    log.info(
        "Candidate {} applied for Job {} (Application ID: {})",
        candidateId,
        jobId,
        application.getId());

    createAiProcessingTask(application);

    return getApplicationDetail(application.getId());
  }

  @Transactional
  public ApplicationResponse applyWithMasterCv(UUID jobId, UUID candidateId) {
    com.tttn.backend_core.entity.Job job =
        jobRepository.findById(jobId).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

    com.tttn.backend_core.entity.User candidate =
        userRepository
            .findById(candidateId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    com.tttn.backend_core.entity.CandidateProfile profile =
        candidateProfileRepository
            .findById(candidateId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Vui lòng tải lên Master CV trước khi ứng tuyển."));

    if (profile.getCvUrl() == null || profile.getRawCvData() == null) {
      throw new IllegalArgumentException("Vui lòng tải lên Master CV trước khi ứng tuyển.");
    }

    Application application =
        Application.builder()
            .candidate(candidate)
            .job(job)
            .resumeUrl(profile.getCvUrl())
            .status(ApplicationStatus.PENDING)
            .aiStatus(com.tttn.backend_core.entity.AiProcessingStatus.WAITING)
            .isCandidateNotified(false)
            .build();

    application = applicationRepository.save(application);
    log.info(
        "Candidate {} applied for Job {} with Master CV (Application ID: {})",
        candidateId,
        jobId,
        application.getId());

    createAiProcessingTaskWithMasterCv(application, profile.getRawCvData());

    return getApplicationDetail(application.getId());
  }

  private void createAiProcessingTask(Application application) {
    createAiProcessingTask(
        application,
        com.tttn.backend_core.entity.AiRunTrigger.CANDIDATE_SUBMIT,
        application.getCandidate(),
        false);
  }

  private void createAiProcessingTask(
      Application application,
      com.tttn.backend_core.entity.AiRunTrigger trigger,
      com.tttn.backend_core.entity.User requestedBy,
      boolean forceCareerPath) {
    java.time.LocalDateTime acceptedAt = java.time.LocalDateTime.now();
    int attempt =
        runRepository
            .findTopByApplication_IdOrderByAttemptDesc(application.getId())
            .map(previous -> previous.getAttempt() + 1)
            .orElse(1);
    com.tttn.backend_core.entity.AiProcessingRun run =
        runRepository.save(
            com.tttn.backend_core.entity.AiProcessingRun.builder()
                .application(application)
                .attempt(attempt)
                .status(com.tttn.backend_core.entity.AiProcessingStatus.WAITING)
                .trigger(trigger)
                .idempotencyKey(UUID.randomUUID().toString())
                .requestedBy(requestedBy)
                .acceptedAt(acceptedAt)
                .build());

    java.util.List<com.tttn.backend_core.entity.AiProcessingStep> steps =
        java.util.Arrays.stream(com.tttn.backend_core.entity.AiStepName.values())
            .map(
                name ->
                    com.tttn.backend_core.entity.AiProcessingStep.builder()
                        .run(run)
                        .stepName(name)
                        .status(
                            name == com.tttn.backend_core.entity.AiStepName.RECEIVED
                                ? com.tttn.backend_core.entity.AiStepStatus.COMPLETED
                                : com.tttn.backend_core.entity.AiStepStatus.PENDING)
                        .message(
                            name == com.tttn.backend_core.entity.AiStepName.RECEIVED
                                ? "Tệp đã được lưu và tiếp nhận."
                                : "Đang chờ xử lý")
                        .startedAt(
                            name == com.tttn.backend_core.entity.AiStepName.RECEIVED
                                ? acceptedAt
                                : null)
                        .finishedAt(
                            name == com.tttn.backend_core.entity.AiStepName.RECEIVED
                                ? acceptedAt
                                : null)
                        .build())
            .toList();
    stepRepository.saveAll(steps);

    java.util.Map<String, Object> message = new java.util.LinkedHashMap<>();
    message.put("schemaVersion", "1.0");
    message.put("requestId", UUID.randomUUID().toString());
    message.put("applicationId", application.getId().toString());
    message.put("runId", run.getId().toString());
    message.put("fileUrl", application.getResumeUrl());
    message.put("callbackQueue", "ai.application.process.events");
    if (forceCareerPath) {
      message.put("forceCareerPath", true);
      message.put("decisionOutcome", "REJECTED");
      message.put("decisionSource", "HR");
      java.util.Map<String, Object> breakdown = application.getScoringBreakdown();
      Object cvData = breakdown == null ? null : breakdown.get("extracted_cv_data");
      Object matchResult = breakdown == null ? null : breakdown.get("matching_result");
      if (cvData instanceof java.util.Map<?, ?> && matchResult instanceof java.util.Map<?, ?>) {
        message.put("skipExtraction", true);
        message.put("skipMatching", true);
        message.put("cvData", cvData);
        message.put("matchResult", matchResult);
        log.info(
            "Application {} rejection will reuse persisted CV and matching snapshots",
            application.getId());
      } else {
        log.warn(
            "Application {} rejection has no reusable AI snapshots; full pipeline is required",
            application.getId());
      }
      application.setAiStatus(com.tttn.backend_core.entity.AiProcessingStatus.WAITING);
      application.setAiErrorCode(null);
      application.setAiErrorMessage(null);
    }

    java.util.Map<String, Object> snapshot = new java.util.LinkedHashMap<>();
    if (application.getJob() != null) {
      snapshot.put("job_id", application.getJob().getId().toString());
      snapshot.put("title", application.getJob().getTitle());
      snapshot.put(
          "department_name",
          application.getJob().getDepartmentName() != null
              ? application.getJob().getDepartmentName()
              : "Unknown");
      snapshot.put(
          "job_family",
          application.getJob().getJobFamily() == null
              ? ""
              : application.getJob().getJobFamily().getName());
      snapshot.put(
          "career_level",
          application.getJob().getCareerLevel() == null
              ? ""
              : application.getJob().getCareerLevel().getName());

      java.util.List<java.util.Map<String, Object>> competencies = new java.util.ArrayList<>();
      for (com.tttn.backend_core.entity.JobCompetency item :
          application.getJob().getRequiredCompetencies()) {
        java.util.Map<String, Object> c = new java.util.LinkedHashMap<>();
        c.put("competency_id", item.getCompetency().getId().toString());
        c.put("name", item.getCompetency().getName());
        c.put("category", item.getCompetency().getCategory());
        c.put("weight", item.getWeight());
        c.put("required_level", item.getRequiredLevel());
        c.put("is_mandatory", Boolean.TRUE.equals(item.getIsMandatory()));
        competencies.add(c);
      }
      snapshot.put("required_competencies", competencies);

      java.util.List<java.util.Map<String, Object>> rules = new java.util.ArrayList<>();
      for (com.tttn.backend_core.entity.InstitutionalRule rule :
          application.getJob().getInstitutionalRules()) {
        if (rule.getPedigreeGroup() == null || !Boolean.TRUE.equals(rule.getIsActive())) {
          continue;
        }
        java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
        item.put("rule_id", rule.getId().toString());
        item.put("rule_code", rule.getRuleCode());
        item.put("name", rule.getName());
        item.put("evidence_source", rule.getPedigreeGroup().getEvidenceSource().name());
        item.put(
            "eligible_entity_ids",
            rule.getPedigreeGroup().getMembers().stream()
                .map(member -> member.getId().toString())
                .toList());
        item.put("bonus_points", rule.getBonusPoints());
        item.put("max_impact_percent", rule.getMaxImpactPercent());
        rules.add(item);
      }
      snapshot.put("institutional_rules", rules);

      java.util.List<String> requiredSkills =
          application.getJob().getRequiredCompetencies().stream()
              .map(jc -> jc.getCompetency().getName())
              .toList();
      snapshot.put("required_skills", requiredSkills);
    } else {
      snapshot.put("job_id", "default_job");
      snapshot.put("title", "Master Profile Upload");
      snapshot.put("job_family", "General");
      snapshot.put("required_competencies", java.util.Collections.emptyList());
      snapshot.put("required_skills", java.util.Collections.emptyList());

      // Tell AI Service to skip matching if it supports it
      message.put("skipMatching", true);
    }

    message.put("jobSnapshot", snapshot);

    outboxRepository.save(
        com.tttn.backend_core.entity.AiProcessingOutbox.builder()
            .id(UUID.randomUUID())
            .runId(run.getId())
            .applicationId(application.getId())
            .payload(message)
            .status("NEW")
            .build());
  }

  private void createAiProcessingTaskWithMasterCv(
      Application application, java.util.Map<String, Object> rawCvData) {
    java.time.LocalDateTime acceptedAt = java.time.LocalDateTime.now();
    com.tttn.backend_core.entity.AiProcessingRun run =
        runRepository.save(
            com.tttn.backend_core.entity.AiProcessingRun.builder()
                .application(application)
                .attempt(1)
                .status(com.tttn.backend_core.entity.AiProcessingStatus.WAITING)
                .trigger(com.tttn.backend_core.entity.AiRunTrigger.CANDIDATE_SUBMIT)
                .idempotencyKey(UUID.randomUUID().toString())
                .requestedBy(application.getCandidate())
                .acceptedAt(acceptedAt)
                .build());

    java.util.List<com.tttn.backend_core.entity.AiProcessingStep> steps =
        java.util.Arrays.stream(com.tttn.backend_core.entity.AiStepName.values())
            .map(
                name ->
                    com.tttn.backend_core.entity.AiProcessingStep.builder()
                        .run(run)
                        .stepName(name)
                        .status(
                            name == com.tttn.backend_core.entity.AiStepName.RECEIVED
                                ? com.tttn.backend_core.entity.AiStepStatus.COMPLETED
                                : com.tttn.backend_core.entity.AiStepStatus.PENDING)
                        .message(
                            name == com.tttn.backend_core.entity.AiStepName.RECEIVED
                                ? "Tệp đã được lưu và tiếp nhận."
                                : "Đang chờ xử lý")
                        .startedAt(
                            name == com.tttn.backend_core.entity.AiStepName.RECEIVED
                                ? acceptedAt
                                : null)
                        .finishedAt(
                            name == com.tttn.backend_core.entity.AiStepName.RECEIVED
                                ? acceptedAt
                                : null)
                        .build())
            .toList();
    stepRepository.saveAll(steps);

    java.util.Map<String, Object> message = new java.util.LinkedHashMap<>();
    message.put("schemaVersion", "1.0");
    message.put("requestId", UUID.randomUUID().toString());
    message.put("applicationId", application.getId().toString());
    message.put("runId", run.getId().toString());
    message.put("fileUrl", application.getResumeUrl());
    message.put("callbackQueue", "ai.application.process.events");

    java.util.Map<String, Object> snapshot = new java.util.LinkedHashMap<>();
    if (application.getJob() != null) {
      snapshot.put("job_id", application.getJob().getId().toString());
      snapshot.put("title", application.getJob().getTitle());
      snapshot.put(
          "department_name",
          application.getJob().getDepartmentName() != null
              ? application.getJob().getDepartmentName()
              : "Unknown");
      snapshot.put(
          "job_family",
          application.getJob().getJobFamily() == null
              ? ""
              : application.getJob().getJobFamily().getName());
      snapshot.put(
          "career_level",
          application.getJob().getCareerLevel() == null
              ? ""
              : application.getJob().getCareerLevel().getName());

      java.util.List<java.util.Map<String, Object>> competencies = new java.util.ArrayList<>();
      for (com.tttn.backend_core.entity.JobCompetency item :
          application.getJob().getRequiredCompetencies()) {
        java.util.Map<String, Object> c = new java.util.LinkedHashMap<>();
        c.put("competency_id", item.getCompetency().getId().toString());
        c.put("name", item.getCompetency().getName());
        c.put("category", item.getCompetency().getCategory());
        c.put("weight", item.getWeight());
        c.put("required_level", item.getRequiredLevel());
        c.put("is_mandatory", Boolean.TRUE.equals(item.getIsMandatory()));
        competencies.add(c);
      }
      snapshot.put("required_competencies", competencies);

      java.util.List<String> requiredSkills =
          application.getJob().getRequiredCompetencies().stream()
              .map(jc -> jc.getCompetency().getName())
              .toList();
      snapshot.put("required_skills", requiredSkills);
    }

    message.put("jobSnapshot", snapshot);
    message.put("skipExtraction", true);
    message.put("cvData", rawCvData);

    outboxRepository.save(
        com.tttn.backend_core.entity.AiProcessingOutbox.builder()
            .id(UUID.randomUUID())
            .runId(run.getId())
            .applicationId(application.getId())
            .payload(message)
            .status("NEW")
            .build());
  }
}
