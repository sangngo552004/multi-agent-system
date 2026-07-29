package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.response.ActivityResponse;
import com.tttn.backend_core.dto.response.AdminDashboardResponse;
import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDashboardService {

  private static final int RECENT_ACTIVITY_LIMIT = 6;

  private final UserRepository userRepository;
  private final ApplicationRepository applicationRepository;
  private final AdminJobService adminJobService;
  private final ActivityLogService activityLogService;
  private final Clock clock;

  public AdminDashboardService(
      UserRepository userRepository,
      ApplicationRepository applicationRepository,
      AdminJobService adminJobService,
      ActivityLogService activityLogService,
      Clock clock) {
    this.userRepository = userRepository;
    this.applicationRepository = applicationRepository;
    this.adminJobService = adminJobService;
    this.activityLogService = activityLogService;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public AdminDashboardResponse getDashboard(int rangeDays) {
    validateRange(rangeDays);

    Instant generatedAt = clock.instant();
    LocalDate todayUtc = LocalDate.now(clock);
    LocalDate firstDay = todayUtc.minusDays(rangeDays - 1L);
    LocalDateTime fromInclusive = firstDay.atStartOfDay();
    LocalDateTime toExclusive = todayUtc.plusDays(1).atStartOfDay();

    long totalUsers = userRepository.count();
    long blockedUsers = userRepository.countByIsActiveFalse();
    long openJobs = adminJobService.countJobsByStatus(JobStatus.OPEN);
    long incompleteJobs = adminJobService.countIncompleteNonClosedJobs();

    Map<AiProcessingStatus, Long> aiStatusCounts = loadAiStatusCounts(fromInclusive, toExclusive);
    long applicationsInRange = aiStatusCounts.values().stream().mapToLong(Long::longValue).sum();
    long completed = aiStatusCounts.get(AiProcessingStatus.COMPLETED);
    long failed = aiStatusCounts.get(AiProcessingStatus.FAILED);
    int completionRate =
        applicationsInRange == 0 ? 0 : (int) Math.round(completed * 100.0 / applicationsInRange);

    List<ActivityResponse> recentActivities = activityLogService.findRecent(RECENT_ACTIVITY_LIMIT);
    boolean hasData =
        totalUsers > 0 || openJobs > 0 || applicationsInRange > 0 || !recentActivities.isEmpty();

    return new AdminDashboardResponse(
        rangeDays,
        generatedAt,
        hasData,
        new AdminDashboardResponse.Metrics(
            totalUsers,
            blockedUsers,
            openJobs,
            incompleteJobs,
            applicationsInRange,
            completed,
            failed,
            completionRate),
        aiStatusCounts,
        loadApplicationTrend(firstDay, todayUtc, fromInclusive, toExclusive),
        recentActivities);
  }

  private Map<AiProcessingStatus, Long> loadAiStatusCounts(
      LocalDateTime fromInclusive, LocalDateTime toExclusive) {
    EnumMap<AiProcessingStatus, Long> counts = new EnumMap<>(AiProcessingStatus.class);
    for (AiProcessingStatus status : AiProcessingStatus.values()) {
      counts.put(status, 0L);
    }
    applicationRepository
        .countByAiStatusBetween(fromInclusive, toExclusive)
        .forEach(item -> counts.put(item.getStatus(), item.getTotal()));
    return counts;
  }

  private List<AdminDashboardResponse.ApplicationTrendPoint> loadApplicationTrend(
      LocalDate firstDay,
      LocalDate todayUtc,
      LocalDateTime fromInclusive,
      LocalDateTime toExclusive) {
    Map<LocalDate, Long> countsByDay = new LinkedHashMap<>();
    firstDay.datesUntil(todayUtc.plusDays(1)).forEach(date -> countsByDay.put(date, 0L));

    applicationRepository
        .countApplicationsByDay(fromInclusive, toExclusive)
        .forEach(
            item ->
                countsByDay.put(
                    LocalDate.of(item.getYearValue(), item.getMonthValue(), item.getDayValue()),
                    item.getTotal()));

    return countsByDay.entrySet().stream()
        .map(
            entry ->
                new AdminDashboardResponse.ApplicationTrendPoint(entry.getKey(), entry.getValue()))
        .toList();
  }

  private void validateRange(int rangeDays) {
    if (rangeDays != 7 && rangeDays != 30) {
      throw new AppException(ErrorCode.INVALID_DASHBOARD_RANGE);
    }
  }
}
