package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.AiProcessingStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record AdminDashboardResponse(
    int rangeDays,
    Instant generatedAt,
    boolean hasData,
    Metrics metrics,
    Map<AiProcessingStatus, Long> aiStatusCounts,
    List<ApplicationTrendPoint> applicationTrend,
    List<ActivityResponse> recentActivities) {

  public record Metrics(
      long totalUsers,
      long blockedUsers,
      long openJobs,
      long incompleteJobs,
      long applicationsInRange,
      long aiCompletedInRange,
      long aiFailedInRange,
      int aiCompletionRate) {}

  public record ApplicationTrendPoint(LocalDate date, long count) {}
}
