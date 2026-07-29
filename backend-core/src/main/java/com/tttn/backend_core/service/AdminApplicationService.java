package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.response.AdminApplicationDetailResponse;
import com.tttn.backend_core.dto.response.AdminApplicationResponse;
import com.tttn.backend_core.dto.response.AiRetryAcceptedResponse;
import com.tttn.backend_core.dto.response.PageResponse;
import com.tttn.backend_core.entity.*;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.*;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
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
public class AdminApplicationService {

  private static final Collection<AiProcessingStatus> ACTIVE_STATUSES =
      List.of(AiProcessingStatus.WAITING, AiProcessingStatus.PROCESSING);
  private static final Set<String> SORT_FIELDS =
      Set.of(
          "id",
          "candidate.fullName",
          "job.title",
          "job.departmentName",
          "aiStatus",
          "extractionMethod",
          "aiConfidence",
          "appliedAt");
  private static final Map<AiStepName, String> STEP_LABELS =
      Map.of(
          AiStepName.RECEIVED, "Tiếp nhận CV",
          AiStepName.EXTRACTION, "Trích xuất",
          AiStepName.MATCHING, "Đối sánh",
          AiStepName.CAREER_PATH, "Lộ trình nghề nghiệp",
          AiStepName.COMPLETED, "Hoàn tất");
  private static final Map<AiStepName, String> STEP_MESSAGES =
      Map.of(
          AiStepName.RECEIVED, "Tệp đã được lưu và tiếp nhận.",
          AiStepName.EXTRACTION, "Đọc thông tin hồ sơ và kinh nghiệm.",
          AiStepName.MATCHING, "So sánh hồ sơ với yêu cầu công việc.",
          AiStepName.CAREER_PATH, "Xây đề xuất phát triển cá nhân.",
          AiStepName.COMPLETED, "Tổng hợp kết quả cuối cùng.");

  private final ApplicationRepository applicationRepository;
  private final AiProcessingRunRepository runRepository;
  private final AiProcessingStepRepository stepRepository;
  private final AiProcessingOutboxRepository outboxRepository;
  private final UserRepository userRepository;

  public AdminApplicationService(
      ApplicationRepository applicationRepository,
      AiProcessingRunRepository runRepository,
      AiProcessingStepRepository stepRepository,
      AiProcessingOutboxRepository outboxRepository,
      UserRepository userRepository) {
    this.applicationRepository = applicationRepository;
    this.runRepository = runRepository;
    this.stepRepository = stepRepository;
    this.outboxRepository = outboxRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public PageResponse<AdminApplicationResponse> findAll(
      String search,
      AiProcessingStatus aiStatus,
      String dateRange,
      int page,
      int size,
      String sort) {
    Page<Application> result =
        applicationRepository.findAll(
            buildFilters(search, aiStatus, dateRange),
            PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), parseSort(sort)));
    List<UUID> ids = result.getContent().stream().map(Application::getId).toList();
    Map<UUID, Application> applications =
        ids.isEmpty()
            ? Map.of()
            : applicationRepository.findAdminApplicationsByIds(ids).stream()
                .collect(Collectors.toMap(Application::getId, Function.identity()));
    Map<UUID, AiProcessingRun> latestRuns = latestRuns(ids);
    List<AdminApplicationResponse> items =
        ids.stream()
            .map(applications::get)
            .filter(Objects::nonNull)
            .map(item -> toResponse(item, latestRuns.get(item.getId())))
            .toList();
    return PageResponse.from(result, items);
  }

  @Transactional(readOnly = true)
  public AdminApplicationDetailResponse findById(UUID id) {
    Application application =
        applicationRepository
            .findAdminApplicationById(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
    AiProcessingRun latest =
        runRepository.findTopByApplication_IdOrderByAttemptDesc(id).orElse(null);
    List<AdminApplicationDetailResponse.PipelineStep> pipeline =
        latest == null ? legacyPipeline() : persistedPipeline(latest);
    AdminApplicationResponse summary = toResponse(application, latest);
    return new AdminApplicationDetailResponse(
        summary.id(),
        summary.candidateId(),
        summary.candidateName(),
        summary.jobId(),
        summary.jobTitle(),
        summary.departmentName(),
        summary.aiStatus(),
        summary.submittedAt(),
        summary.aiConfidence(),
        summary.needsReview(),
        summary.extractionMethod(),
        summary.errorCode(),
        summary.errorMessage(),
        summary.canRetry(),
        new AdminApplicationDetailResponse.CandidateSummary(
            application.getCandidate().getId(), application.getCandidate().getFullName()),
        new AdminApplicationDetailResponse.JobSummary(
            application.getJob().getId(),
            application.getJob().getTitle(),
            departmentName(application.getJob())),
        pipeline,
        application.getAiWarningCount());
  }

  @Transactional
  public AiRetryAcceptedResponse retry(
      UUID applicationId, String idempotencyKey, String actorEmail) {
    String key = validateIdempotencyKey(idempotencyKey);
    Application application =
        applicationRepository
            .findAdminApplicationById(applicationId)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

    AiProcessingRun idempotentRun =
        runRepository.findByApplication_IdAndIdempotencyKey(applicationId, key).orElse(null);
    if (idempotentRun != null) {
      return acceptedResponse(idempotentRun);
    }
    if (runRepository.existsByApplication_IdAndStatusIn(applicationId, ACTIVE_STATUSES)) {
      throw new AppException(ErrorCode.AI_RUN_ALREADY_ACTIVE);
    }

    AiProcessingRun latest =
        runRepository
            .findTopByApplication_IdOrderByAttemptDesc(applicationId)
            .orElseThrow(() -> new AppException(ErrorCode.AI_RETRY_NOT_ALLOWED));
    if (latest.getStatus() != AiProcessingStatus.FAILED
        || application.getAiStatus() != AiProcessingStatus.FAILED
        || "INVALID_FILE".equalsIgnoreCase(application.getAiErrorCode())) {
      throw new AppException(ErrorCode.AI_RETRY_NOT_ALLOWED);
    }

    User actor =
        userRepository
            .findByEmail(actorEmail)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    LocalDateTime acceptedAt = LocalDateTime.now();
    AiProcessingRun run =
        runRepository.save(
            AiProcessingRun.builder()
                .application(application)
                .attempt(latest.getAttempt() + 1)
                .status(AiProcessingStatus.WAITING)
                .trigger(AiRunTrigger.ADMIN_RETRY)
                .idempotencyKey(key)
                .requestedBy(actor)
                .acceptedAt(acceptedAt)
                .build());
    stepRepository.saveAll(initialSteps(run, acceptedAt));

    application.setAiStatus(AiProcessingStatus.WAITING);
    application.setAiErrorCode(null);
    application.setAiErrorMessage(null);
    applicationRepository.save(application);
    outboxRepository.save(
        AiProcessingOutbox.builder()
            .id(UUID.randomUUID())
            .runId(run.getId())
            .applicationId(applicationId)
            .payload(processRequest(application, run))
            .status("NEW")
            .build());
    return acceptedResponse(run);
  }

  private Specification<Application> buildFilters(
      String search, AiProcessingStatus aiStatus, String dateRange) {
    LocalDateTime cutoff = dateCutoff(dateRange);
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (search != null && !search.isBlank()) {
        String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        List<Predicate> matches = new ArrayList<>();
        matches.add(cb.like(cb.lower(root.join("candidate").get("fullName")), keyword));
        matches.add(cb.like(cb.lower(root.join("job").get("title")), keyword));
        matches.add(cb.like(cb.lower(root.join("job").get("departmentName")), keyword));
        try {
          matches.add(cb.equal(root.get("id"), UUID.fromString(search.trim())));
        } catch (IllegalArgumentException ignored) {
          // Text search remains applicable when the value is not a UUID.
        }
        predicates.add(cb.or(matches.toArray(Predicate[]::new)));
      }
      if (aiStatus != null) {
        predicates.add(cb.equal(root.get("aiStatus"), aiStatus));
      }
      if (cutoff != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("appliedAt"), cutoff));
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  private LocalDateTime dateCutoff(String dateRange) {
    if (dateRange == null || dateRange.isBlank() || "ALL".equalsIgnoreCase(dateRange)) {
      return null;
    }
    return switch (dateRange) {
      case "7" -> LocalDateTime.now().minusDays(7);
      case "30" -> LocalDateTime.now().minusDays(30);
      default -> throw new AppException(ErrorCode.INVALID_APPLICATION_FILTER);
    };
  }

  private Sort parseSort(String value) {
    if (value == null || value.isBlank()) {
      return Sort.by(Sort.Direction.DESC, "appliedAt");
    }
    String[] parts = value.split(",", 2);
    String requestedField =
        switch (parts[0]) {
          case "candidateName" -> "candidate.fullName";
          case "jobTitle" -> "job.title";
          case "departmentName" -> "job.departmentName";
          case "submittedAt" -> "appliedAt";
          default -> parts[0];
        };
    String field = SORT_FIELDS.contains(requestedField) ? requestedField : "appliedAt";
    Sort.Direction direction =
        parts.length > 1 && "asc".equalsIgnoreCase(parts[1])
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;
    return Sort.by(direction, field);
  }

  private Map<UUID, AiProcessingRun> latestRuns(List<UUID> ids) {
    if (ids.isEmpty()) {
      return Map.of();
    }
    return runRepository.findLatestByApplicationIds(ids).stream()
        .collect(Collectors.toMap(item -> item.getApplication().getId(), Function.identity()));
  }

  private AdminApplicationResponse toResponse(Application application, AiProcessingRun latestRun) {
    return new AdminApplicationResponse(
        application.getId(),
        application.getCandidate().getId(),
        application.getCandidate().getFullName(),
        application.getJob().getId(),
        application.getJob().getTitle(),
        departmentName(application.getJob()),
        application.getAiStatus(),
        application.getAppliedAt(),
        application.getAiConfidence(),
        Boolean.TRUE.equals(application.getNeedsReview()),
        application.getExtractionMethod(),
        application.getAiErrorCode(),
        application.getAiErrorMessage(),
        canRetry(application, latestRun));
  }

  private boolean canRetry(Application application, AiProcessingRun latestRun) {
    return application.getAiStatus() == AiProcessingStatus.FAILED
        && latestRun != null
        && latestRun.getStatus() == AiProcessingStatus.FAILED
        && !"INVALID_FILE".equalsIgnoreCase(application.getAiErrorCode());
  }

  private List<AdminApplicationDetailResponse.PipelineStep> persistedPipeline(AiProcessingRun run) {
    Map<AiStepName, AiProcessingStep> persisted =
        stepRepository.findByRun_IdOrderByStepNameAsc(run.getId()).stream()
            .collect(Collectors.toMap(AiProcessingStep::getStepName, Function.identity()));
    return Arrays.stream(AiStepName.values())
        .map(
            name -> {
              AiProcessingStep step = persisted.get(name);
              return step == null
                  ? new AdminApplicationDetailResponse.PipelineStep(
                      name,
                      STEP_LABELS.get(name),
                      AiStepStatus.PENDING,
                      STEP_MESSAGES.get(name),
                      null,
                      null)
                  : new AdminApplicationDetailResponse.PipelineStep(
                      name,
                      STEP_LABELS.get(name),
                      step.getStatus(),
                      step.getMessage(),
                      step.getStartedAt(),
                      step.getFinishedAt());
            })
        .toList();
  }

  private List<AdminApplicationDetailResponse.PipelineStep> legacyPipeline() {
    return Arrays.stream(AiStepName.values())
        .map(
            name ->
                new AdminApplicationDetailResponse.PipelineStep(
                    name,
                    STEP_LABELS.get(name),
                    AiStepStatus.PENDING,
                    "Chưa có lượt xử lý AI được ghi nhận.",
                    null,
                    null))
        .toList();
  }

  private List<AiProcessingStep> initialSteps(AiProcessingRun run, LocalDateTime acceptedAt) {
    return Arrays.stream(AiStepName.values())
        .map(
            name ->
                AiProcessingStep.builder()
                    .run(run)
                    .stepName(name)
                    .status(
                        name == AiStepName.RECEIVED ? AiStepStatus.COMPLETED : AiStepStatus.PENDING)
                    .message(STEP_MESSAGES.get(name))
                    .startedAt(name == AiStepName.RECEIVED ? acceptedAt : null)
                    .finishedAt(name == AiStepName.RECEIVED ? acceptedAt : null)
                    .build())
        .toList();
  }

  private Map<String, Object> processRequest(Application application, AiProcessingRun run) {
    Map<String, Object> message = new LinkedHashMap<>();
    message.put("schemaVersion", "1.0");
    message.put("requestId", UUID.randomUUID().toString());
    message.put("applicationId", application.getId().toString());
    message.put("runId", run.getId().toString());
    message.put("fileUrl", application.getResumeUrl());
    message.put("callbackQueue", "ai.application.process.events");
    message.put("jobSnapshot", jobSnapshot(application.getJob()));
    return message;
  }

  private Map<String, Object> jobSnapshot(Job job) {
    Map<String, Object> snapshot = new LinkedHashMap<>();
    snapshot.put("job_id", job.getId().toString());
    snapshot.put("title", job.getTitle());
    snapshot.put("department_name", departmentName(job));
    snapshot.put("job_family", job.getJobFamily() == null ? "" : job.getJobFamily().getName());
    snapshot.put(
        "career_level", job.getCareerLevel() == null ? "" : job.getCareerLevel().getName());
    snapshot.put(
        "required_skills",
        job.getRequiredCompetencies().stream()
            .map(JobCompetency::getCompetency)
            .map(Competency::getName)
            .toList());
    snapshot.put(
        "required_competencies",
        job.getRequiredCompetencies().stream().map(this::competencySnapshot).toList());
    return snapshot;
  }

  private Map<String, Object> competencySnapshot(JobCompetency item) {
    Map<String, Object> snapshot = new LinkedHashMap<>();
    snapshot.put("competency_id", item.getCompetency().getId().toString());
    snapshot.put("name", item.getCompetency().getName());
    snapshot.put("category", item.getCompetency().getCategory());
    snapshot.put("weight", item.getWeight());
    snapshot.put("required_level", item.getRequiredLevel());
    snapshot.put("is_mandatory", Boolean.TRUE.equals(item.getIsMandatory()));
    return snapshot;
  }

  private AiRetryAcceptedResponse acceptedResponse(AiProcessingRun run) {
    return new AiRetryAcceptedResponse(
        run.getApplication().getId(), run.getId(), AiProcessingStatus.WAITING, run.getAcceptedAt());
  }

  private String validateIdempotencyKey(String value) {
    if (value == null || value.isBlank() || value.trim().length() > 120) {
      throw new AppException(ErrorCode.IDEMPOTENCY_KEY_REQUIRED);
    }
    return value.trim();
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
}
