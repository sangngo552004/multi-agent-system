package com.tttn.backend_core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.tttn.backend_core.dto.response.AdminJobDetailResponse;
import com.tttn.backend_core.dto.response.JobFilterOptionsResponse;
import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.entity.CareerLevel;
import com.tttn.backend_core.entity.EmploymentType;
import com.tttn.backend_core.entity.Job;
import com.tttn.backend_core.entity.JobFamily;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.entity.User;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.CareerLevelRepository;
import com.tttn.backend_core.repository.JobFamilyRepository;
import com.tttn.backend_core.repository.JobRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminJobServiceTest {

  @Mock private JobRepository jobRepository;
  @Mock private ApplicationRepository applicationRepository;
  @Mock private JobFamilyRepository jobFamilyRepository;
  @Mock private CareerLevelRepository careerLevelRepository;

  private AdminJobService adminJobService;

  @BeforeEach
  void setUp() {
    adminJobService =
        new AdminJobService(
            jobRepository, applicationRepository, jobFamilyRepository, careerLevelRepository);
  }

  @Test
  void getFilterOptionsKeepsInactiveValuesUsedByHistoricalJobs() {
    JobFamily inactiveFamily =
        JobFamily.builder()
            .id(UUID.randomUUID())
            .name("Legacy Engineering")
            .isActive(false)
            .build();
    CareerLevel activeLevel =
        CareerLevel.builder()
            .id(UUID.randomUUID())
            .name("Senior")
            .rankValue(4)
            .isActive(true)
            .build();
    when(jobFamilyRepository.findAllByOrderByNameAsc()).thenReturn(List.of(inactiveFamily));
    when(careerLevelRepository.findAllByOrderByRankValueAsc()).thenReturn(List.of(activeLevel));

    JobFilterOptionsResponse result = adminJobService.getFilterOptions();

    assertEquals("INACTIVE", result.jobFamilies().getFirst().status());
    assertEquals("ACTIVE", result.careerLevels().getFirst().status());
  }

  @Test
  void findByIdCountsCompletedAndFailedApplicationsByAiStatus() {
    UUID jobId = UUID.randomUUID();
    User owner =
        User.builder()
            .id(UUID.randomUUID())
            .email("hr@example.com")
            .fullName("HR Owner")
            .role(Role.HR)
            .build();
    Job job =
        Job.builder()
            .id(jobId)
            .hr(owner)
            .title("Backend Engineer")
            .departmentName("Engineering")
            .location("Hồ Chí Minh")
            .employmentType(EmploymentType.FULL_TIME)
            .description("Build internal services")
            .requirements("Java")
            .benefits("Healthcare")
            .status(JobStatus.PUBLISHED)
            .createdAt(LocalDateTime.parse("2026-07-01T08:00:00"))
            .expiredAt(LocalDateTime.parse("2026-08-01T08:00:00"))
            .build();
    when(jobRepository.findAdminJobById(jobId)).thenReturn(Optional.of(job));
    when(applicationRepository.countByJobIds(List.of(jobId)))
        .thenReturn(List.<Object[]>of(new Object[] {jobId, 6L}));
    ApplicationRepository.AiStatusCountProjection completed =
        aiStatusCount(AiProcessingStatus.COMPLETED, 4L);
    ApplicationRepository.AiStatusCountProjection failed =
        aiStatusCount(AiProcessingStatus.FAILED, 2L);
    when(applicationRepository.countByAiStatusForJob(jobId)).thenReturn(List.of(completed, failed));

    AdminJobDetailResponse result = adminJobService.findById(jobId);

    assertEquals(6L, result.job().applicationCount());
    assertEquals(4L, result.aiCompletedCount());
    assertEquals(2L, result.aiFailedCount());
  }

  @Test
  void findAllRejectsUnknownReadinessFilter() {
    AppException exception =
        assertThrows(
            AppException.class,
            () ->
                adminJobService.findAll(null, null, null, null, "BROKEN", 0, 20, "createdAt,desc"));

    assertEquals(ErrorCode.INVALID_ADMIN_FILTER, exception.getErrorCode());
    verifyNoInteractions(jobRepository, applicationRepository);
  }

  private ApplicationRepository.AiStatusCountProjection aiStatusCount(
      AiProcessingStatus status, long total) {
    ApplicationRepository.AiStatusCountProjection projection =
        mock(ApplicationRepository.AiStatusCountProjection.class);
    when(projection.getStatus()).thenReturn(status);
    when(projection.getTotal()).thenReturn(total);
    return projection;
  }
}
