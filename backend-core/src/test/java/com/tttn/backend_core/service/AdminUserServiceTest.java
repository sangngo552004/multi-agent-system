package com.tttn.backend_core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;

import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.JobRepository;
import com.tttn.backend_core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private JobRepository jobRepository;
  @Mock private ApplicationRepository applicationRepository;
  @Mock private ActivityLogService activityLogService;
  @Mock private RefreshTokenService refreshTokenService;

  private AdminUserService adminUserService;

  @BeforeEach
  void setUp() {
    adminUserService =
        new AdminUserService(
            userRepository,
            jobRepository,
            applicationRepository,
            activityLogService,
            refreshTokenService);
  }

  @Test
  void findAllRejectsUnknownStatusFilter() {
    AppException exception =
        assertThrows(
            AppException.class,
            () -> adminUserService.findAll(null, null, "UNKNOWN", 0, 20, "createdAt,desc"));

    assertEquals(ErrorCode.INVALID_ADMIN_FILTER, exception.getErrorCode());
    verifyNoInteractions(
        userRepository,
        jobRepository,
        applicationRepository,
        activityLogService,
        refreshTokenService);
  }
}
