package com.tttn.backend_core.service;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.response.ApplicationResponse;
import com.tttn.backend_core.entity.Application;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.entity.QApplication;
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

  @Transactional(readOnly = true)
  public Page<ApplicationResponse> getApplicationsByJob(
      UUID jobId, Predicate predicate, Pageable pageable) {
    QApplication q = QApplication.application;
    Predicate jobPredicate = q.job.id.eq(jobId);
    Predicate finalPredicate =
        predicate != null
            ? com.querydsl.core.types.ExpressionUtils.allOf(jobPredicate, predicate)
            : jobPredicate;

    return applicationRepository
        .findAll(finalPredicate, pageable)
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
}
