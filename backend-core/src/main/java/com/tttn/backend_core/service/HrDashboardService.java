package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.response.HrDashboardResponse;
import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.JobRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HrDashboardService {
  private final JobRepository jobRepository;
  private final ApplicationRepository applicationRepository;
  private final Clock clock;

  public HrDashboardService(
      JobRepository jobRepository, ApplicationRepository applicationRepository, Clock clock) {
    this.jobRepository = jobRepository;
    this.applicationRepository = applicationRepository;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public HrDashboardResponse getDashboard(String hrEmail, int rangeDays) {
    if (rangeDays != 7 && rangeDays != 30)
      throw new AppException(ErrorCode.INVALID_DASHBOARD_RANGE);
    LocalDateTime now = LocalDateTime.now(clock);
    LocalDateTime cutoff = now.minusDays(rangeDays - 1L).toLocalDate().atStartOfDay();
    var jobs =
        jobRepository.findAll((root, query, cb) -> cb.equal(root.join("hr").get("email"), hrEmail));
    var applications =
        applicationRepository.findAll(
            (root, query, cb) -> cb.equal(root.join("job").join("hr").get("email"), hrEmail));
    long draft = jobs.stream().filter(job -> job.getStatus() == JobStatus.DRAFT).count();
    long published = jobs.stream().filter(job -> job.getStatus() == JobStatus.PUBLISHED).count();
    long closed = jobs.stream().filter(job -> job.getStatus() == JobStatus.CLOSED).count();
    long expiringSoon =
        jobs.stream()
            .filter(
                job ->
                    job.getStatus() == JobStatus.PUBLISHED
                        && job.getExpiredAt() != null
                        && !job.getExpiredAt().isBefore(now)
                        && !job.getExpiredAt().isAfter(now.plusDays(7)))
            .count();
    long newApplications =
        applications.stream()
            .filter(app -> app.getAppliedAt() != null && !app.getAppliedAt().isBefore(cutoff))
            .count();
    long shortlisted =
        applications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.SHORTLISTED)
            .count();
    long rejected =
        applications.stream()
            .filter(
                app ->
                    app.getStatus() == ApplicationStatus.REJECTED
                        || app.getStatus() == ApplicationStatus.REJECTED_FINAL)
            .count();
    long waiting =
        applications.stream()
            .filter(app -> app.getAiStatus() == AiProcessingStatus.WAITING)
            .count();
    long processing =
        applications.stream()
            .filter(app -> app.getAiStatus() == AiProcessingStatus.PROCESSING)
            .count();
    long failed =
        applications.stream().filter(app -> app.getAiStatus() == AiProcessingStatus.FAILED).count();
    long needsReview =
        applications.stream().filter(app -> Boolean.TRUE.equals(app.getNeedsReview())).count();
    return new HrDashboardResponse(
        rangeDays,
        clock.instant(),
        !jobs.isEmpty() || !applications.isEmpty(),
        new HrDashboardResponse.JobMetrics(draft, published, closed, expiringSoon),
        new HrDashboardResponse.ApplicationMetrics(
            newApplications, shortlisted, rejected, waiting, processing, failed, needsReview),
        Map.of());
  }
}
