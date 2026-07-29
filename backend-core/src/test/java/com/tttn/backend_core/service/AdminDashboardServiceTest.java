package com.tttn.backend_core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.tttn.backend_core.dto.response.ActivityResponse;
import com.tttn.backend_core.dto.response.AdminDashboardResponse;
import com.tttn.backend_core.entity.ActivityKind;
import com.tttn.backend_core.entity.ActivitySource;
import com.tttn.backend_core.entity.ActivityTargetType;
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
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

  private static final Instant NOW = Instant.parse("2026-07-29T10:00:00Z");

  @Mock private UserRepository userRepository;
  @Mock private ApplicationRepository applicationRepository;
  @Mock private AdminJobService adminJobService;
  @Mock private ActivityLogService activityLogService;

  private AdminDashboardService adminDashboardService;

  @BeforeEach
  void setUp() {
    adminDashboardService =
        new AdminDashboardService(
            userRepository,
            applicationRepository,
            adminJobService,
            activityLogService,
            Clock.fixed(NOW, ZoneOffset.UTC));
  }

  @Test
  void getDashboardAggregatesMetricsAndFillsMissingTrendDays() {
    List<ApplicationRepository.AiStatusCountProjection> statusCounts =
        List.of(
            aiStatusCount(AiProcessingStatus.COMPLETED, 30L),
            aiStatusCount(AiProcessingStatus.PROCESSING, 2L),
            aiStatusCount(AiProcessingStatus.WAITING, 1L),
            aiStatusCount(AiProcessingStatus.FAILED, 2L));
    List<ApplicationRepository.DailyApplicationCountProjection> dailyCounts =
        List.of(dailyCount(2026, 7, 28, 5L));

    when(userRepository.count()).thenReturn(120L);
    when(userRepository.countByIsActiveFalse()).thenReturn(3L);
    when(adminJobService.countJobsByStatus(JobStatus.PUBLISHED)).thenReturn(12L);
    when(adminJobService.countIncompleteNonClosedJobs()).thenReturn(2L);
    when(applicationRepository.countByAiStatusBetween(
            LocalDateTime.parse("2026-07-23T00:00:00"), LocalDateTime.parse("2026-07-30T00:00:00")))
        .thenReturn(statusCounts);
    when(applicationRepository.countApplicationsByDay(
            LocalDateTime.parse("2026-07-23T00:00:00"), LocalDateTime.parse("2026-07-30T00:00:00")))
        .thenReturn(dailyCounts);
    when(activityLogService.findRecent(6)).thenReturn(List.of(activity()));

    AdminDashboardResponse result = adminDashboardService.getDashboard(7);

    assertEquals(7, result.rangeDays());
    assertEquals(NOW, result.generatedAt());
    assertEquals(120L, result.metrics().totalUsers());
    assertEquals(35L, result.metrics().applicationsInRange());
    assertEquals(86, result.metrics().aiCompletionRate());
    assertEquals(2L, result.aiStatusCounts().get(AiProcessingStatus.FAILED));
    assertEquals(7, result.applicationTrend().size());
    assertEquals(LocalDate.parse("2026-07-23"), result.applicationTrend().getFirst().date());
    assertEquals(0L, result.applicationTrend().getFirst().count());
    assertEquals(5L, result.applicationTrend().get(5).count());
    assertEquals(1, result.recentActivities().size());
  }

  @Test
  void getDashboardReturnsEmptyStateWhenNoDomainDataExists() {
    when(applicationRepository.countByAiStatusBetween(
            LocalDateTime.parse("2026-06-30T00:00:00"), LocalDateTime.parse("2026-07-30T00:00:00")))
        .thenReturn(List.of());
    when(applicationRepository.countApplicationsByDay(
            LocalDateTime.parse("2026-06-30T00:00:00"), LocalDateTime.parse("2026-07-30T00:00:00")))
        .thenReturn(List.of());
    when(activityLogService.findRecent(6)).thenReturn(List.of());

    AdminDashboardResponse result = adminDashboardService.getDashboard(30);

    assertFalse(result.hasData());
    assertEquals(30, result.applicationTrend().size());
    assertEquals(0, result.metrics().aiCompletionRate());
  }

  @Test
  void getDashboardRejectsUnsupportedRangeBeforeQueryingRepositories() {
    AppException exception =
        assertThrows(AppException.class, () -> adminDashboardService.getDashboard(14));

    assertEquals(ErrorCode.INVALID_DASHBOARD_RANGE, exception.getErrorCode());
    verifyNoInteractions(
        userRepository, applicationRepository, adminJobService, activityLogService);
  }

  private ApplicationRepository.AiStatusCountProjection aiStatusCount(
      AiProcessingStatus status, long total) {
    ApplicationRepository.AiStatusCountProjection projection =
        mock(ApplicationRepository.AiStatusCountProjection.class);
    when(projection.getStatus()).thenReturn(status);
    when(projection.getTotal()).thenReturn(total);
    return projection;
  }

  private ApplicationRepository.DailyApplicationCountProjection dailyCount(
      int year, int month, int day, long total) {
    ApplicationRepository.DailyApplicationCountProjection projection =
        mock(ApplicationRepository.DailyApplicationCountProjection.class);
    when(projection.getYearValue()).thenReturn(year);
    when(projection.getMonthValue()).thenReturn(month);
    when(projection.getDayValue()).thenReturn(day);
    when(projection.getTotal()).thenReturn(total);
    return projection;
  }

  private ActivityResponse activity() {
    UUID id = UUID.randomUUID();
    return new ActivityResponse(
        id,
        ActivityKind.KNOWLEDGE_CHANGED,
        ActivitySource.ADMIN,
        "System Admin",
        "đã cập nhật năng lực",
        ActivityTargetType.KNOWLEDGE,
        UUID.randomUUID(),
        "Java",
        "/admin/knowledge",
        LocalDateTime.parse("2026-07-29T09:00:00"));
  }
}
