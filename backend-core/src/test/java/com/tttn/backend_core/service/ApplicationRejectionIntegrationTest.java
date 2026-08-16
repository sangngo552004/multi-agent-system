package com.tttn.backend_core.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.tttn.backend_core.controller.CandidateApplicationController;
import com.tttn.backend_core.dto.response.CandidateApplicationResponse;
import com.tttn.backend_core.entity.AiProcessingOutbox;
import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.entity.AiRunTrigger;
import com.tttn.backend_core.entity.Application;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.entity.EmploymentType;
import com.tttn.backend_core.entity.Job;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.entity.User;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ApplicationRejectionIntegrationTest {

  @Autowired private ApplicationService applicationService;
  @Autowired private CandidateApplicationController candidateController;
  @Autowired private EntityManager entityManager;

  @Test
  void hrRejectionQueuesCareerPathAndCandidateApiRevealsSafeCandidateViewAfterNotification() {
    User hr = user("career-hr@example.com", Role.HR);
    User candidate = user("career-candidate@example.com", Role.CANDIDATE);
    entityManager.persist(hr);
    entityManager.persist(candidate);

    Job job =
        Job.builder()
            .hr(hr)
            .title("Career Path Test Job")
            .location("Ha Noi")
            .employmentType(EmploymentType.FULL_TIME)
            .description("Test description")
            .requirements("Test requirements")
            .status(JobStatus.PUBLISHED)
            .build();
    entityManager.persist(job);

    Application application =
        Application.builder()
            .candidate(candidate)
            .job(job)
            .resumeUrl("http://localhost:8080/uploads/test.pdf")
            .status(ApplicationStatus.PENDING)
            .aiStatus(AiProcessingStatus.COMPLETED)
            .build();
    entityManager.persist(application);
    entityManager.flush();

    applicationService.rejectApplication(application.getId(), hr.getEmail());
    entityManager.flush();

    AiProcessingOutbox outbox =
        entityManager
            .createQuery(
                "select o from AiProcessingOutbox o where o.applicationId = :applicationId",
                AiProcessingOutbox.class)
            .setParameter("applicationId", application.getId())
            .getSingleResult();

    assertThat(application.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
    assertThat(application.getAiStatus()).isEqualTo(AiProcessingStatus.WAITING);
    assertThat(application.getIsCandidateNotified()).isFalse();
    assertThat(outbox.getPayload())
        .containsEntry("forceCareerPath", true)
        .containsEntry("decisionOutcome", "REJECTED")
        .containsEntry("decisionSource", "HR");
    assertThat(outbox.getRunId()).isNotNull();
    assertThat(
            entityManager
                .createQuery(
                    "select r.trigger from AiProcessingRun r where r.id = :runId",
                    AiRunTrigger.class)
                .setParameter("runId", outbox.getRunId())
                .getSingleResult())
        .isEqualTo(AiRunTrigger.HR_REJECTION);

    Map<String, Object> candidateView =
        Map.of(
            "summary", "A safe development summary",
            "target_role", "Career Path Test Job",
            "phases", List.of());
    application.setScoringBreakdown(
        Map.of("career_path_result", Map.of("candidate_view", candidateView)));
    application.setIsCandidateNotified(true);
    entityManager.flush();

    List<CandidateApplicationResponse> responses =
        candidateController.getMyApplications(candidate::getEmail).getResult();

    assertThat(responses).hasSize(1);
    assertThat(responses.getFirst().getStatus()).isEqualTo(ApplicationStatus.REJECTED);
    assertThat(responses.getFirst().getCareerPathAdvice())
        .containsEntry("summary", "A safe development summary")
        .doesNotContainKey("internal_draft");
  }

  private User user(String email, Role role) {
    return User.builder().email(email).passwordHash("not-used").fullName(email).role(role).build();
  }
}
