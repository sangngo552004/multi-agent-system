package com.tttn.backend_core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.tttn.backend_core.entity.ActivityTargetType;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ActivityLogRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ActivityLogServiceTest {

  @Mock private ActivityLogRepository activityLogRepository;

  private ActivityLogService service;

  @BeforeEach
  void setUp() {
    service = new ActivityLogService(activityLogRepository, Clock.systemUTC());
  }

  @Test
  void rejectsUnknownActivityGroup() {
    AppException exception =
        assertThrows(
            AppException.class,
            () -> service.findAll(null, "UNKNOWN", null, null, null, null, 0, 20));

    assertEquals(ErrorCode.INVALID_ADMIN_FILTER, exception.getErrorCode());
  }

  @Test
  void rejectsIncompleteTargetScope() {
    AppException exception =
        assertThrows(
            AppException.class,
            () -> service.findAll(null, "ALL", ActivityTargetType.USER, null, null, null, 0, 20));

    assertEquals(ErrorCode.INVALID_ADMIN_FILTER, exception.getErrorCode());
  }

  @Test
  void rejectsReversedDateRange() {
    LocalDateTime now = LocalDateTime.of(2026, 7, 29, 10, 0);
    AppException exception =
        assertThrows(
            AppException.class,
            () ->
                service.findAll(
                    null,
                    "ALL",
                    ActivityTargetType.USER,
                    UUID.randomUUID(),
                    now,
                    now.minusDays(1),
                    0,
                    20));

    assertEquals(ErrorCode.INVALID_ADMIN_FILTER, exception.getErrorCode());
  }
}
