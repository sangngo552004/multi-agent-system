package com.tttn.backend_core.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.tttn.backend_core.dto.request.JobCompetencyRequest;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.entity.EmploymentType;
import com.tttn.backend_core.entity.Job;
import com.tttn.backend_core.entity.JobCompetency;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.entity.User;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JobPublishingIntegrationTest {

  @Autowired private JobService jobService;
  @Autowired private EntityManager entityManager;

  @Test
  void canUpdateExistingCompetencyAndPublishWithoutInsertingDuplicate() {
    User owner =
        User.builder()
            .email("publish-test@example.com")
            .passwordHash("not-used")
            .fullName("Publish Test HR")
            .role(Role.HR)
            .build();
    entityManager.persist(owner);

    Competency competency =
        Competency.builder().name("Publish Test Java").category("HARD_SKILL").build();
    entityManager.persist(competency);

    Job job =
        Job.builder()
            .hr(owner)
            .title("Publish regression test")
            .location("Ha Noi")
            .employmentType(EmploymentType.FULL_TIME)
            .description("Regression test job description")
            .requirements("Java")
            .benefits("Testing")
            .status(JobStatus.DRAFT)
            .build();
    entityManager.persist(job);

    JobCompetency configuredCompetency = new JobCompetency();
    configuredCompetency.setJob(job);
    configuredCompetency.setCompetency(competency);
    configuredCompetency.setWeight(100.0);
    configuredCompetency.setRequiredLevel(3);
    configuredCompetency.setIsMandatory(true);
    entityManager.persist(configuredCompetency);
    entityManager.flush();
    entityManager.clear();

    JobCompetencyRequest update = new JobCompetencyRequest();
    update.setCompetencyId(competency.getId());
    update.setWeight(100.0);
    update.setRequiredLevel(4);
    update.setIsMandatory(true);
    jobService.updateJobCompetencies(job.getId(), List.of(update));

    JobResponse published = jobService.publishJob(job.getId(), owner.getEmail());
    entityManager.flush();
    entityManager.clear();

    Long configuredCount =
        entityManager
            .createQuery(
                "select count(jc) from JobCompetency jc where jc.job.id = :jobId and jc.competency.id = :competencyId",
                Long.class)
            .setParameter("jobId", job.getId())
            .setParameter("competencyId", competency.getId())
            .getSingleResult();
    Job persistedJob = entityManager.find(Job.class, job.getId());

    assertThat(configuredCount).isEqualTo(1L);
    assertThat(persistedJob.getStatus()).isEqualTo(JobStatus.PUBLISHED);
    assertThat(persistedJob.getSnapshotData()).isNotBlank();
    assertThat(published.getStatus()).isEqualTo(JobStatus.PUBLISHED);
  }
}
