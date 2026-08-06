package com.tttn.backend_core.dto.response;

import java.time.Instant;
import java.util.Map;

public record HrDashboardResponse(
    int rangeDays,
    Instant generatedAt,
    boolean hasData,
    JobMetrics jobs,
    ApplicationMetrics applications,
    Map<String, Long> batchEmailStatuses) {
  public record JobMetrics(long draft, long published, long closed, long expiringSoon) {}

  public record ApplicationMetrics(
      long newApplications,
      long shortlisted,
      long rejected,
      long aiWaiting,
      long aiProcessing,
      long aiFailed,
      long needsReview) {}
}
