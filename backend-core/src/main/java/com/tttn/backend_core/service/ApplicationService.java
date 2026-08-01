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

  @Transactional(readOnly = true)
  public Page<ApplicationResponse> getApplicationsByJob(
      UUID jobId,
      ApplicationStatus status,
      com.tttn.backend_core.entity.AiProcessingStatus aiStatus,
      Boolean needsReview,
      Pageable pageable) {

    org.springframework.data.jpa.domain.Specification<Application> spec =
        (root, query, cb) -> {
          java.util.List<jakarta.persistence.criteria.Predicate> predicates =
              new java.util.ArrayList<>();
          predicates.add(cb.equal(root.get("job").get("id"), jobId));

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

    return applicationRepository
        .findAll(spec, pageable)
        .map(
            app ->
                ApplicationResponse.builder()
                    .id(app.getId())
                    .candidateId(app.getCandidate().getId())
                    .candidateName(app.getCandidate().getFullName())
                    .candidateEmail(app.getCandidate().getEmail())
                    .resumeUrl(app.getResumeUrl())
                    .status(app.getStatus())
                    .fitScore(app.getFitScore())
                    .aiFeedback(app.getAiFeedback())
                    .appliedAt(app.getAppliedAt())
                    .updatedAt(app.getUpdatedAt())
                    .build());
  }

  @Transactional(readOnly = true)
  public ApplicationResponse getApplicationDetail(UUID id) {
    Application app =
        applicationRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

    return ApplicationResponse.builder()
        .id(app.getId())
        .candidateId(app.getCandidate().getId())
        .candidateName(app.getCandidate().getFullName())
        .candidateEmail(app.getCandidate().getEmail())
        .resumeUrl(app.getResumeUrl())
        .status(app.getStatus())
        .fitScore(app.getFitScore())
        .aiFeedback(app.getAiFeedback())
        .scoringBreakdown(app.getScoringBreakdown())
        .appliedAt(app.getAppliedAt())
        .updatedAt(app.getUpdatedAt())
        .build();
  }

  @Transactional
  public void approveApplication(UUID id) {
    Application application =
        applicationRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

    application.setStatus(ApplicationStatus.SHORTLISTED);
    applicationRepository.save(application);
    log.info("Application {} approved (Status -> SHORTLISTED)", id);
  }

  @Transactional
  public void rejectApplication(UUID id) {
    Application application =
        applicationRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

    application.setStatus(ApplicationStatus.REJECTED);
    applicationRepository.save(application);
    log.info("Application {} rejected (Status -> REJECTED)", id);
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

    outboxRepository.save(
        com.tttn.backend_core.entity.AiProcessingOutbox.builder()
            .applicationId(application.getId())
            .status("NEW")
            .build());

    return getApplicationDetail(application.getId());
  }
}
