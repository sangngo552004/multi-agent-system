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
    return applicationMapper.toResponse(application);
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
    applicationRepository.save(application);
    log.info("Application {} rejected (Status -> REJECTED)", id);
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
