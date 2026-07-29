package com.tttn.backend_core.repository.impl;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.entity.EmploymentType;
import com.tttn.backend_core.entity.Job;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.entity.QJob;
import com.tttn.backend_core.repository.custom.JobRepositoryCustom;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

@RequiredArgsConstructor
public class JobRepositoryImpl implements JobRepositoryCustom {

  private final JPAQueryFactory queryFactory;

  @Override
  public Page<Job> searchJobs(JobFilterRequest filter, Pageable pageable) {
    QJob qJob = QJob.job;

    JPAQuery<Job> query =
        queryFactory
            .selectFrom(qJob)
            .where(
                statusEq(qJob, filter.getStatus()),
                keywordContains(qJob, filter.getKeyword()),
                locationContains(qJob, filter.getLocation()),
                employmentTypeEq(qJob, filter.getEmploymentType()),
                jobFamilyIdEq(qJob, filter.getJobFamilyId()),
                careerLevelIdEq(qJob, filter.getCareerLevelId()));

    long total = query.fetchCount();

    List<Job> jobs = query.offset(pageable.getOffset()).limit(pageable.getPageSize()).fetch();

    return new PageImpl<>(jobs, pageable, total);
  }

  private BooleanExpression statusEq(QJob qJob, JobStatus status) {
    return status != null ? qJob.status.eq(status) : null;
  }

  private BooleanExpression keywordContains(QJob qJob, String keyword) {
    return StringUtils.hasText(keyword)
        ? qJob.title
            .containsIgnoreCase(keyword)
            .or(qJob.description.containsIgnoreCase(keyword))
            .or(qJob.requirements.containsIgnoreCase(keyword))
        : null;
  }

  private BooleanExpression locationContains(QJob qJob, String location) {
    return StringUtils.hasText(location) ? qJob.location.containsIgnoreCase(location) : null;
  }

  private BooleanExpression employmentTypeEq(QJob qJob, EmploymentType employmentType) {
    return employmentType != null ? qJob.employmentType.eq(employmentType) : null;
  }

  private BooleanExpression jobFamilyIdEq(QJob qJob, UUID jobFamilyId) {
    return jobFamilyId != null ? qJob.jobFamily.id.eq(jobFamilyId) : null;
  }

  private BooleanExpression careerLevelIdEq(QJob qJob, UUID careerLevelId) {
    return careerLevelId != null ? qJob.careerLevel.id.eq(careerLevelId) : null;
  }
}
