package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.CareerLevelKnowledgeRequest;
import com.tttn.backend_core.dto.request.CompetencyKnowledgeRequest;
import com.tttn.backend_core.dto.request.CompetencyLevelsRequest;
import com.tttn.backend_core.dto.request.JobFamilyKnowledgeRequest;
import com.tttn.backend_core.dto.request.KnowledgeStatusRequest;
import com.tttn.backend_core.dto.response.KnowledgeOverviewResponse;
import com.tttn.backend_core.entity.CareerLevel;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.entity.CompetencyLevel;
import com.tttn.backend_core.entity.JobFamily;
import com.tttn.backend_core.entity.KnowledgeItemStatus;
import com.tttn.backend_core.entity.User;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.CareerLevelRepository;
import com.tttn.backend_core.repository.CompetencyLevelRepository;
import com.tttn.backend_core.repository.CompetencyRepository;
import com.tttn.backend_core.repository.JobCompetencyRepository;
import com.tttn.backend_core.repository.JobFamilyRepository;
import com.tttn.backend_core.repository.JobRepository;
import com.tttn.backend_core.repository.UserRepository;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminKnowledgeService {

  private static final List<String> DEFAULT_LEVEL_TITLES =
      List.of("Cơ bản", "Thực hành", "Độc lập", "Thành thạo", "Chuyên gia");

  private final JobFamilyRepository jobFamilyRepository;
  private final CareerLevelRepository careerLevelRepository;
  private final CompetencyRepository competencyRepository;
  private final CompetencyLevelRepository competencyLevelRepository;
  private final JobCompetencyRepository jobCompetencyRepository;
  private final JobRepository jobRepository;
  private final UserRepository userRepository;
  private final ActivityLogService activityLogService;

  public AdminKnowledgeService(
      JobFamilyRepository jobFamilyRepository,
      CareerLevelRepository careerLevelRepository,
      CompetencyRepository competencyRepository,
      CompetencyLevelRepository competencyLevelRepository,
      JobCompetencyRepository jobCompetencyRepository,
      JobRepository jobRepository,
      UserRepository userRepository,
      ActivityLogService activityLogService) {
    this.jobFamilyRepository = jobFamilyRepository;
    this.careerLevelRepository = careerLevelRepository;
    this.competencyRepository = competencyRepository;
    this.competencyLevelRepository = competencyLevelRepository;
    this.jobCompetencyRepository = jobCompetencyRepository;
    this.jobRepository = jobRepository;
    this.userRepository = userRepository;
    this.activityLogService = activityLogService;
  }

  @Transactional(readOnly = true)
  public KnowledgeOverviewResponse getOverview() {
    List<JobFamily> families = jobFamilyRepository.findAllByOrderByNameAsc();
    List<CareerLevel> careerLevels = careerLevelRepository.findAllByOrderByRankValueAsc();
    List<Competency> competencies = competencyRepository.findAllByOrderByNameAsc();
    List<UUID> competencyIds = competencies.stream().map(Competency::getId).toList();
    Map<UUID, List<CompetencyLevel>> levelsByCompetency =
        competencyIds.isEmpty()
            ? Map.of()
            : competencyLevelRepository.findByCompetencyIds(competencyIds).stream()
                .collect(Collectors.groupingBy(item -> item.getCompetency().getId()));

    Map<UUID, Long> familyUsage =
        countMap(
            families.stream().map(JobFamily::getId).toList(), jobRepository::countByJobFamilyIds);
    Map<UUID, Long> careerUsage =
        countMap(
            careerLevels.stream().map(CareerLevel::getId).toList(),
            jobRepository::countByCareerLevelIds);
    Map<UUID, Long> competencyUsage =
        countMap(competencyIds, jobCompetencyRepository::countByCompetencyIds);

    return new KnowledgeOverviewResponse(
        families.stream()
            .map(
                item ->
                    new KnowledgeOverviewResponse.JobFamilyItem(
                        item.getId(),
                        item.getName(),
                        item.getDescription(),
                        status(item.getIsActive()),
                        familyUsage.getOrDefault(item.getId(), 0L)))
            .toList(),
        careerLevels.stream()
            .map(
                item ->
                    new KnowledgeOverviewResponse.CareerLevelItem(
                        item.getId(),
                        item.getName(),
                        item.getDescription(),
                        item.getRankValue(),
                        status(item.getIsActive()),
                        careerUsage.getOrDefault(item.getId(), 0L)))
            .toList(),
        competencies.stream()
            .map(
                item ->
                    toCompetency(
                        item,
                        competencyUsage.getOrDefault(item.getId(), 0L),
                        levelsByCompetency.getOrDefault(item.getId(), List.of())))
            .toList());
  }

  @Transactional(readOnly = true)
  public KnowledgeOverviewResponse.CompetencyItem getCompetency(UUID id) {
    Competency competency =
        competencyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.KNOWLEDGE_NOT_FOUND));
    List<CompetencyLevel> levels = competencyLevelRepository.findByCompetencyIdOrderByLevelAsc(id);
    long usage =
        countMap(List.of(id), jobCompetencyRepository::countByCompetencyIds).getOrDefault(id, 0L);
    return toCompetency(competency, usage, levels);
  }

  @Transactional
  public KnowledgeOverviewResponse.JobFamilyItem createJobFamily(
      JobFamilyKnowledgeRequest request, String actorEmail) {
    String name = normalize(request.name());
    ensureFamilyNameAvailable(name, null);
    JobFamily item =
        jobFamilyRepository.save(
            JobFamily.builder()
                .name(name)
                .description(request.description().trim())
                .isActive(true)
                .build());
    recordChange(actorEmail, item.getId(), item.getName(), "thêm", "JOB_FAMILY");
    return new KnowledgeOverviewResponse.JobFamilyItem(
        item.getId(), item.getName(), item.getDescription(), status(item.getIsActive()), 0);
  }

  @Transactional
  public KnowledgeOverviewResponse.JobFamilyItem updateJobFamily(
      UUID id, JobFamilyKnowledgeRequest request, String actorEmail) {
    JobFamily item =
        jobFamilyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.KNOWLEDGE_NOT_FOUND));
    String name = normalize(request.name());
    ensureFamilyNameAvailable(name, id);
    item.setName(name);
    item.setDescription(request.description().trim());
    recordChange(actorEmail, id, item.getName(), "cập nhật", "JOB_FAMILY");
    return new KnowledgeOverviewResponse.JobFamilyItem(
        item.getId(),
        item.getName(),
        item.getDescription(),
        status(item.getIsActive()),
        usageForFamily(id));
  }

  @Transactional
  public KnowledgeOverviewResponse.CareerLevelItem createCareerLevel(
      CareerLevelKnowledgeRequest request, String actorEmail) {
    String name = normalize(request.name());
    ensureCareerLevelAvailable(name, request.rankValue(), null);
    CareerLevel item =
        careerLevelRepository.save(
            CareerLevel.builder()
                .name(name)
                .description(request.description().trim())
                .rankValue(request.rankValue())
                .isActive(true)
                .build());
    recordChange(actorEmail, item.getId(), item.getName(), "thêm", "CAREER_LEVEL");
    return new KnowledgeOverviewResponse.CareerLevelItem(
        item.getId(),
        item.getName(),
        item.getDescription(),
        item.getRankValue(),
        status(item.getIsActive()),
        0);
  }

  @Transactional
  public KnowledgeOverviewResponse.CareerLevelItem updateCareerLevel(
      UUID id, CareerLevelKnowledgeRequest request, String actorEmail) {
    CareerLevel item =
        careerLevelRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.KNOWLEDGE_NOT_FOUND));
    String name = normalize(request.name());
    ensureCareerLevelAvailable(name, request.rankValue(), id);
    item.setName(name);
    item.setDescription(request.description().trim());
    item.setRankValue(request.rankValue());
    recordChange(actorEmail, id, item.getName(), "cập nhật", "CAREER_LEVEL");
    return new KnowledgeOverviewResponse.CareerLevelItem(
        item.getId(),
        item.getName(),
        item.getDescription(),
        item.getRankValue(),
        status(item.getIsActive()),
        usageForCareerLevel(id));
  }

  @Transactional
  public KnowledgeOverviewResponse.CompetencyItem createCompetency(
      CompetencyKnowledgeRequest request, String actorEmail) {
    String name = normalize(request.name());
    ensureCompetencyNameAvailable(name, null);
    Competency item =
        competencyRepository.save(
            Competency.builder()
                .name(name)
                .category(normalize(request.category()))
                .description(request.description().trim())
                .isActive(true)
                .build());
    List<CompetencyLevel> levels =
        competencyLevelRepository.saveAll(
            java.util.stream.IntStream.rangeClosed(1, 5)
                .mapToObj(
                    level ->
                        CompetencyLevel.builder()
                            .competency(item)
                            .level(level)
                            .label(DEFAULT_LEVEL_TITLES.get(level - 1))
                            .description("")
                            .build())
                .toList());
    recordChange(actorEmail, item.getId(), item.getName(), "thêm", "COMPETENCY");
    return toCompetency(item, 0, levels);
  }

  @Transactional
  public KnowledgeOverviewResponse.CompetencyItem updateCompetency(
      UUID id, CompetencyKnowledgeRequest request, String actorEmail) {
    Competency item =
        competencyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.KNOWLEDGE_NOT_FOUND));
    String name = normalize(request.name());
    ensureCompetencyNameAvailable(name, id);
    item.setName(name);
    item.setCategory(normalize(request.category()));
    item.setDescription(request.description().trim());
    recordChange(actorEmail, id, item.getName(), "cập nhật", "COMPETENCY");
    return getCompetencyForMutation(item, usageForCompetency(id));
  }

  @Transactional
  public KnowledgeOverviewResponse.CompetencyItem updateCompetencyLevels(
      UUID id, CompetencyLevelsRequest request, String actorEmail) {
    Competency competency =
        competencyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.KNOWLEDGE_NOT_FOUND));
    Set<Integer> levelNumbers =
        request.levels().stream()
            .map(CompetencyLevelsRequest.CompetencyLevelInput::level)
            .collect(Collectors.toSet());
    if (!levelNumbers.equals(Set.of(1, 2, 3, 4, 5))) {
      throw new AppException(ErrorCode.INVALID_COMPETENCY_LEVELS);
    }

    Map<Integer, CompetencyLevel> existing =
        competencyLevelRepository.findByCompetencyIdOrderByLevelAsc(id).stream()
            .collect(Collectors.toMap(CompetencyLevel::getLevel, Function.identity()));
    List<CompetencyLevel> levels =
        request.levels().stream()
            .map(
                input -> {
                  CompetencyLevel level =
                      existing.getOrDefault(
                          input.level(),
                          CompetencyLevel.builder()
                              .competency(competency)
                              .level(input.level())
                              .build());
                  level.setLabel(input.title().trim());
                  level.setDescription(input.description().trim());
                  return level;
                })
            .sorted(java.util.Comparator.comparing(CompetencyLevel::getLevel))
            .toList();
    competencyLevelRepository.saveAll(levels);
    recordChange(actorEmail, id, competency.getName(), "cập nhật thang năng lực", "COMPETENCY");
    return toCompetency(competency, usageForCompetency(id), levels);
  }

  @Transactional
  public KnowledgeOverviewResponse updateStatus(
      String entity, UUID id, KnowledgeStatusRequest request, String actorEmail) {
    boolean active = request.status() == KnowledgeItemStatus.ACTIVE;
    switch (entity.toLowerCase(Locale.ROOT)) {
      case "job-families" -> updateFamilyStatus(id, active, request.force(), actorEmail);
      case "career-levels" -> updateCareerStatus(id, active, request.force(), actorEmail);
      case "competencies" -> updateCompetencyStatus(id, active, request.force(), actorEmail);
      default -> throw new AppException(ErrorCode.INVALID_KNOWLEDGE_ENTITY);
    }
    return getOverview();
  }

  private void updateFamilyStatus(UUID id, boolean active, boolean force, String actorEmail) {
    JobFamily item =
        jobFamilyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.KNOWLEDGE_NOT_FOUND));
    requireForceWhenInUse(active, force, usageForFamily(id));
    item.setIsActive(active);
    recordChange(
        actorEmail, id, item.getName(), active ? "bật sử dụng" : "ngừng sử dụng", "JOB_FAMILY");
  }

  private void updateCareerStatus(UUID id, boolean active, boolean force, String actorEmail) {
    CareerLevel item =
        careerLevelRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.KNOWLEDGE_NOT_FOUND));
    requireForceWhenInUse(active, force, usageForCareerLevel(id));
    item.setIsActive(active);
    recordChange(
        actorEmail, id, item.getName(), active ? "bật sử dụng" : "ngừng sử dụng", "CAREER_LEVEL");
  }

  private void updateCompetencyStatus(UUID id, boolean active, boolean force, String actorEmail) {
    Competency item =
        competencyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.KNOWLEDGE_NOT_FOUND));
    requireForceWhenInUse(active, force, usageForCompetency(id));
    item.setIsActive(active);
    recordChange(
        actorEmail, id, item.getName(), active ? "bật sử dụng" : "ngừng sử dụng", "COMPETENCY");
  }

  private void requireForceWhenInUse(boolean active, boolean force, long usageCount) {
    if (!active && usageCount > 0 && !force) {
      throw new AppException(ErrorCode.KNOWLEDGE_IN_USE);
    }
  }

  private void ensureFamilyNameAvailable(String name, UUID excludedId) {
    if (jobFamilyRepository.existsNormalizedName(name, excludedId)) {
      throw new AppException(ErrorCode.KNOWLEDGE_NAME_CONFLICT);
    }
  }

  private void ensureCareerLevelAvailable(String name, Integer rankValue, UUID excludedId) {
    if (careerLevelRepository.existsNormalizedName(name, excludedId)) {
      throw new AppException(ErrorCode.KNOWLEDGE_NAME_CONFLICT);
    }
    if (careerLevelRepository.existsRankValue(rankValue, excludedId)) {
      throw new AppException(ErrorCode.CAREER_RANK_CONFLICT);
    }
  }

  private void ensureCompetencyNameAvailable(String name, UUID excludedId) {
    if (competencyRepository.existsNormalizedName(name, excludedId)) {
      throw new AppException(ErrorCode.KNOWLEDGE_NAME_CONFLICT);
    }
  }

  private KnowledgeOverviewResponse.CompetencyItem getCompetencyForMutation(
      Competency competency, long usage) {
    return toCompetency(
        competency,
        usage,
        competencyLevelRepository.findByCompetencyIdOrderByLevelAsc(competency.getId()));
  }

  private KnowledgeOverviewResponse.CompetencyItem toCompetency(
      Competency competency, long usageCount, List<CompetencyLevel> levels) {
    List<KnowledgeOverviewResponse.CompetencyLevelItem> levelItems =
        levels.stream()
            .sorted(java.util.Comparator.comparing(CompetencyLevel::getLevel))
            .map(
                item ->
                    new KnowledgeOverviewResponse.CompetencyLevelItem(
                        item.getLevel(), item.getLabel(), item.getDescription()))
            .toList();
    int completed =
        (int)
            levels.stream()
                .filter(
                    item ->
                        item.getLabel() != null
                            && !item.getLabel().isBlank()
                            && item.getDescription() != null
                            && !item.getDescription().isBlank())
                .count();
    return new KnowledgeOverviewResponse.CompetencyItem(
        competency.getId(),
        competency.getName(),
        competency.getCategory(),
        competency.getDescription(),
        status(competency.getIsActive()),
        usageCount,
        completed,
        levelItems);
  }

  private long usageForFamily(UUID id) {
    return countMap(List.of(id), jobRepository::countByJobFamilyIds).getOrDefault(id, 0L);
  }

  private long usageForCareerLevel(UUID id) {
    return countMap(List.of(id), jobRepository::countByCareerLevelIds).getOrDefault(id, 0L);
  }

  private long usageForCompetency(UUID id) {
    return countMap(List.of(id), jobCompetencyRepository::countByCompetencyIds)
        .getOrDefault(id, 0L);
  }

  private Map<UUID, Long> countMap(List<UUID> ids, Function<List<UUID>, List<Object[]>> query) {
    if (ids.isEmpty()) {
      return Map.of();
    }
    Map<UUID, Long> counts = new HashMap<>();
    query.apply(ids).forEach(row -> counts.put((UUID) row[0], (Long) row[1]));
    return counts;
  }

  private void recordChange(
      String actorEmail, UUID id, String label, String action, String entity) {
    User actor =
        userRepository
            .findByEmail(actorEmail)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    activityLogService.recordKnowledgeChanged(actor, id, label, action, entity);
  }

  private KnowledgeItemStatus status(Boolean active) {
    return Boolean.TRUE.equals(active) ? KnowledgeItemStatus.ACTIVE : KnowledgeItemStatus.INACTIVE;
  }

  private String normalize(String value) {
    return Arrays.stream(value.trim().split("\\s+"))
        .filter(part -> !part.isBlank())
        .collect(Collectors.joining(" "));
  }
}
