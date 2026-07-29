package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.response.AdminJobDetailResponse;
import com.tttn.backend_core.dto.response.AdminJobListResponse;
import com.tttn.backend_core.dto.response.AdminJobResponse;
import com.tttn.backend_core.dto.response.JobFilterOptionsResponse;
import com.tttn.backend_core.entity.*;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.CareerLevelRepository;
import com.tttn.backend_core.repository.JobFamilyRepository;
import com.tttn.backend_core.repository.JobRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminJobService {

  private static final Set<String> SORT_FIELDS =
      Set.of("title", "status", "createdAt", "expiredAt", "openingsCount");

  private final JobRepository jobRepository;
  private final ApplicationRepository applicationRepository;
  private final JobFamilyRepository jobFamilyRepository;
  private final CareerLevelRepository careerLevelRepository;

  public AdminJobService(
      JobRepository jobRepository,
      ApplicationRepository applicationRepository,
      JobFamilyRepository jobFamilyRepository,
      CareerLevelRepository careerLevelRepository) {
    this.jobRepository = jobRepository;
    this.applicationRepository = applicationRepository;
    this.jobFamilyRepository = jobFamilyRepository;
    this.careerLevelRepository = careerLevelRepository;
  }

  @Transactional(readOnly = true)
  public JobFilterOptionsResponse getFilterOptions() {
    List<JobFilterOptionsResponse.JobFamilyOption> families =
        jobFamilyRepository.findAllByOrderByNameAsc().stream()
            .map(
                item ->
                    new JobFilterOptionsResponse.JobFamilyOption(
                        item.getId(), item.getName(), knowledgeStatus(item.getIsActive())))
            .toList();
    List<JobFilterOptionsResponse.CareerLevelOption> levels =
        careerLevelRepository.findAllByOrderByRankValueAsc().stream()
            .map(
                item ->
                    new JobFilterOptionsResponse.CareerLevelOption(
                        item.getId(),
                        item.getName(),
                        item.getRankValue(),
                        knowledgeStatus(item.getIsActive())))
            .toList();
    return new JobFilterOptionsResponse(families, levels);
  }

  @Transactional(readOnly = true)
  public AdminJobListResponse findAll(
      String search,
      JobStatus status,
      UUID jobFamilyId,
      UUID careerLevelId,
      String readiness,
      int page,
      int size,
      String sort) {
    validateSearch(search);
    validateReadinessFilter(readiness);
    Specification<Job> filters =
        buildFilters(search, status, jobFamilyId, careerLevelId, readiness);
    Page<Job> result =
        jobRepository.findAll(
            filters, PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), parseSort(sort)));
    List<UUID> ids = result.getContent().stream().map(Job::getId).toList();
    Map<UUID, Job> jobsById =
        ids.isEmpty()
            ? Map.of()
            : jobRepository.findAdminJobsByIds(ids).stream()
                .collect(Collectors.toMap(Job::getId, Function.identity()));
    Map<UUID, Long> applicationCounts = applicationCounts(ids);
    List<AdminJobResponse> items =
        ids.stream()
            .map(jobsById::get)
            .filter(Objects::nonNull)
            .map(job -> toResponse(job, applicationCounts.getOrDefault(job.getId(), 0L)))
            .toList();

    EnumMap<JobStatus, Long> statusCounts = new EnumMap<>(JobStatus.class);
    for (JobStatus candidate : JobStatus.values()) {
      statusCounts.put(
          candidate,
          jobRepository.count(
              buildFilters(search, candidate, jobFamilyId, careerLevelId, readiness)));
    }
    return new AdminJobListResponse(
        items,
        statusCounts,
        result.getNumber(),
        result.getSize(),
        result.getTotalElements(),
        result.getTotalPages(),
        result.isFirst(),
        result.isLast());
  }

  @Transactional(readOnly = true)
  public AdminJobDetailResponse findById(UUID id) {
    Job job =
        jobRepository
            .findAdminJobById(id)
            .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    long applications = applicationCounts(List.of(id)).getOrDefault(id, 0L);
    Map<AiProcessingStatus, Long> aiCounts = aiStatusCounts(id);
    User owner = job.getHr();
    return new AdminJobDetailResponse(
        toResponse(job, applications),
        new AdminJobDetailResponse.AdminJobOwnerResponse(
            owner.getId(),
            owner.getFullName(),
            owner.getEmail(),
            owner.getDepartmentName(),
            owner.getEmployeeCode(),
            owner.getJobTitle()),
        aiCounts.getOrDefault(AiProcessingStatus.COMPLETED, 0L),
        aiCounts.getOrDefault(AiProcessingStatus.FAILED, 0L),
        readinessIssues(job));
  }

  @Transactional(readOnly = true)
  public long countJobsByStatus(JobStatus status) {
    return jobRepository.count((root, query, cb) -> cb.equal(root.get("status"), status));
  }

  @Transactional(readOnly = true)
  public long countIncompleteNonClosedJobs() {
    Specification<Job> nonClosed =
        (root, query, cb) -> cb.notEqual(root.get("status"), JobStatus.CLOSED);
    return jobRepository.count(buildFilters(null, null, null, null, "INCOMPLETE").and(nonClosed));
  }

  private Specification<Job> buildFilters(
      String search, JobStatus status, UUID jobFamilyId, UUID careerLevelId, String readiness) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (search != null && !search.isBlank()) {
        String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        predicates.add(
            cb.or(
                cb.like(cb.lower(root.get("title")), keyword),
                cb.like(cb.lower(root.get("departmentName")), keyword),
                cb.like(cb.lower(root.join("hr").get("fullName")), keyword)));
      }
      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }
      if (jobFamilyId != null) {
        predicates.add(cb.equal(root.get("jobFamily").get("id"), jobFamilyId));
      }
      if (careerLevelId != null) {
        predicates.add(cb.equal(root.get("careerLevel").get("id"), careerLevelId));
      }
      if (readiness != null && !"ALL".equalsIgnoreCase(readiness)) {
        Subquery<Long> competencyCount = query.subquery(Long.class);
        var competency = competencyCount.from(JobCompetency.class);
        competencyCount.select(cb.count(competency)).where(cb.equal(competency.get("job"), root));

        Subquery<Double> weightTotal = query.subquery(Double.class);
        var weightedCompetency = weightTotal.from(JobCompetency.class);
        weightTotal
            .select(cb.coalesce(cb.sum(weightedCompetency.get("weight")), 0.0))
            .where(cb.equal(weightedCompetency.get("job"), root));

        Subquery<Long> invalidLevelCount = query.subquery(Long.class);
        var invalidLevelCompetency = invalidLevelCount.from(JobCompetency.class);
        invalidLevelCount
            .select(cb.count(invalidLevelCompetency))
            .where(
                cb.equal(invalidLevelCompetency.get("job"), root),
                cb.or(
                    cb.lessThan(invalidLevelCompetency.get("requiredLevel"), 1),
                    cb.greaterThan(invalidLevelCompetency.get("requiredLevel"), 5)));

        Predicate ready =
            cb.and(
                cb.notEqual(cb.trim(root.get("title")), ""),
                cb.isNotNull(root.get("jobFamily")),
                cb.isNotNull(root.get("careerLevel")),
                cb.notEqual(cb.trim(root.get("description")), ""),
                cb.notEqual(cb.trim(root.get("requirements")), ""),
                cb.greaterThan(competencyCount, 0L),
                cb.equal(invalidLevelCount, 0L),
                cb.lessThanOrEqualTo(cb.abs(cb.diff(weightTotal, 100.0)), 0.01));
        predicates.add("READY".equalsIgnoreCase(readiness) ? ready : cb.not(ready));
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  private Sort parseSort(String value) {
    if (value == null || value.isBlank()) {
      return Sort.by(Sort.Direction.DESC, "createdAt");
    }
    String[] parts = value.split(",", 2);
    String field = SORT_FIELDS.contains(parts[0]) ? parts[0] : "createdAt";
    Sort.Direction direction =
        parts.length > 1 && "asc".equalsIgnoreCase(parts[1])
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;
    return Sort.by(direction, field);
  }

  private Map<UUID, Long> applicationCounts(List<UUID> ids) {
    if (ids.isEmpty()) {
      return Map.of();
    }
    Map<UUID, Long> counts = new HashMap<>();
    applicationRepository
        .countByJobIds(ids)
        .forEach(row -> counts.put((UUID) row[0], (Long) row[1]));
    return counts;
  }

  private void validateReadinessFilter(String readiness) {
    if (readiness == null
        || readiness.isBlank()
        || "ALL".equalsIgnoreCase(readiness)
        || "READY".equalsIgnoreCase(readiness)
        || "INCOMPLETE".equalsIgnoreCase(readiness)) {
      return;
    }
    throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
  }

  private void validateSearch(String search) {
    if (search != null && search.length() > 100) {
      throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
    }
  }

  private Map<AiProcessingStatus, Long> aiStatusCounts(UUID jobId) {
    EnumMap<AiProcessingStatus, Long> counts = new EnumMap<>(AiProcessingStatus.class);
    applicationRepository
        .countByAiStatusForJob(jobId)
        .forEach(item -> counts.put(item.getStatus(), item.getTotal()));
    return counts;
  }

  private String knowledgeStatus(Boolean active) {
    return Boolean.TRUE.equals(active) ? "ACTIVE" : "INACTIVE";
  }

  private AdminJobResponse toResponse(Job job, long applications) {
    List<String> issues = readinessIssues(job);
    return new AdminJobResponse(
        job.getId(),
        job.getTitle(),
        departmentName(job),
        job.getHr().getId(),
        job.getHr().getFullName(),
        job.getStatus(),
        job.getLocation(),
        job.getEmploymentType(),
        job.getOpeningsCount(),
        job.getDescription(),
        splitLines(job.getRequirements()),
        splitLines(job.getBenefits()),
        job.getJobFamily() == null ? null : job.getJobFamily().getId(),
        job.getJobFamily() == null ? null : job.getJobFamily().getName(),
        job.getCareerLevel() == null ? null : job.getCareerLevel().getId(),
        job.getCareerLevel() == null ? null : job.getCareerLevel().getName(),
        job.getRequiredCompetencies().stream()
            .map(
                item ->
                    new AdminJobResponse.JobCompetencyResponse(
                        item.getCompetency().getId(),
                        item.getCompetency().getName(),
                        item.getRequiredLevel(),
                        item.getWeight(),
                        Boolean.TRUE.equals(item.getIsMandatory())))
            .toList(),
        job.getCreatedAt(),
        job.getExpiredAt(),
        applications,
        issues.isEmpty());
  }

  private List<String> readinessIssues(Job job) {
    List<String> issues = new ArrayList<>();
    if (job.getTitle() == null || job.getTitle().isBlank()) {
      issues.add("Thiếu tiêu đề");
    }
    if (job.getDescription() == null || job.getDescription().isBlank()) {
      issues.add("Thiếu mô tả công việc");
    }
    if (job.getRequirements() == null || job.getRequirements().isBlank()) {
      issues.add("Thiếu yêu cầu ứng viên");
    }
    if (job.getJobFamily() == null) {
      issues.add("Chưa chọn nhóm nghề");
    }
    if (job.getCareerLevel() == null) {
      issues.add("Chưa chọn cấp bậc");
    }
    if (job.getRequiredCompetencies().isEmpty()) {
      issues.add("Chưa cấu hình năng lực");
    } else {
      double totalWeight =
          job.getRequiredCompetencies().stream()
              .map(JobCompetency::getWeight)
              .filter(Objects::nonNull)
              .mapToDouble(Double::doubleValue)
              .sum();
      if (Math.abs(totalWeight - 100.0) > 0.01) {
        issues.add("Tổng trọng số năng lực phải bằng 100%");
      }
      if (job.getRequiredCompetencies().stream()
          .anyMatch(
              item ->
                  item.getRequiredLevel() == null
                      || item.getRequiredLevel() < 1
                      || item.getRequiredLevel() > 5)) {
        issues.add("Cấp độ năng lực phải từ 1 đến 5");
      }
    }
    return issues;
  }

  private String departmentName(Job job) {
    if (job.getDepartmentName() != null && !job.getDepartmentName().isBlank()) {
      return job.getDepartmentName();
    }
    if (job.getHr().getDepartmentName() != null && !job.getHr().getDepartmentName().isBlank()) {
      return job.getHr().getDepartmentName();
    }
    return "Chưa cập nhật";
  }

  private List<String> splitLines(String value) {
    if (value == null || value.isBlank()) {
      return List.of();
    }
    return Arrays.stream(value.split("(?:\\\\n|\\R)"))
        .map(String::trim)
        .map(line -> line.replaceFirst("^[-•]\\s*", ""))
        .filter(line -> !line.isBlank())
        .toList();
  }
}
