package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.response.ActivityPageResponse;
import com.tttn.backend_core.dto.response.ActivityResponse;
import com.tttn.backend_core.entity.*;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ActivityLogRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityLogService {

  private static final List<ActivityKind> AI_ACTIVITY_KINDS =
      List.of(
          ActivityKind.AI_SCORING_STARTED,
          ActivityKind.AI_SCORING_COMPLETED,
          ActivityKind.AI_SCORING_FAILED);
  private static final Set<String> ACTIVITY_GROUPS =
      Set.of("ALL", "ADMIN", "CONTENT", "APPLICATION", "AI");

  private final ActivityLogRepository activityLogRepository;
  private final Clock clock;

  public ActivityLogService(ActivityLogRepository activityLogRepository, Clock clock) {
    this.activityLogRepository = activityLogRepository;
    this.clock = clock;
  }

  public ActivityPageResponse findAll(
      String search,
      String group,
      ActivityTargetType targetType,
      UUID targetId,
      LocalDateTime from,
      LocalDateTime to,
      int page,
      int size) {
    validateFilters(search, group, targetType, targetId, from, to);
    Specification<ActivityLog> filters =
        buildFilters(search, group, targetType, targetId, from, to);
    Page<ActivityLog> result =
        activityLogRepository.findAll(
            filters,
            PageRequest.of(
                Math.max(page, 0),
                Math.clamp(size, 1, 100),
                Sort.by(Sort.Direction.DESC, "createdAt")));
    List<ActivityResponse> items = result.getContent().stream().map(this::toResponse).toList();
    long last24Hours =
        activityLogRepository.count(
            filters.and(
                (root, query, cb) ->
                    cb.greaterThanOrEqualTo(
                        root.get("createdAt"), LocalDateTime.now(clock).minusHours(24))));
    long aiRelated =
        activityLogRepository.count(
            filters.and((root, query, cb) -> root.get("kind").in(AI_ACTIVITY_KINDS)));

    return new ActivityPageResponse(
        items,
        result.getNumber(),
        result.getSize(),
        result.getTotalElements(),
        result.getTotalPages(),
        result.isFirst(),
        result.isLast(),
        new ActivityPageResponse.ActivitySummary(
            result.getTotalElements(), last24Hours, aiRelated));
  }

  public void recordUserStatusChanged(User actor, User target, String status, String reason) {
    activityLogRepository.save(
        ActivityLog.builder()
            .actor(actor)
            .actorName(actor.getFullName())
            .kind(ActivityKind.USER_STATUS_CHANGED)
            .source(ActivitySource.ADMIN)
            .targetType(ActivityTargetType.USER)
            .targetId(target.getId())
            .targetLabel(target.getFullName())
            .description(
                "đã chuyển trạng thái tài khoản sang " + status + ". Lý do: " + reason.trim())
            .metadata(Map.of("status", status, "reason", reason.trim()))
            .build());
  }

  public void recordKnowledgeChanged(
      User actor, UUID targetId, String targetLabel, String action, String entity) {
    activityLogRepository.save(
        ActivityLog.builder()
            .actor(actor)
            .actorName(actor.getFullName())
            .kind(ActivityKind.KNOWLEDGE_CHANGED)
            .source(ActivitySource.ADMIN)
            .targetType(ActivityTargetType.KNOWLEDGE)
            .targetId(targetId)
            .targetLabel(targetLabel)
            .description("đã " + action + " " + targetLabel)
            .metadata(Map.of("action", action, "entity", entity))
            .build());
  }

  public void recordAiProcessingTerminal(
      UUID applicationId, String targetLabel, boolean completed, String errorCode) {
    Map<String, Object> metadata = new java.util.HashMap<>();
    metadata.put("status", completed ? "COMPLETED" : "FAILED");
    if (errorCode != null) {
      metadata.put("errorCode", errorCode);
    }
    activityLogRepository.save(
        ActivityLog.builder()
            .actorName("AI Pipeline")
            .kind(completed ? ActivityKind.AI_SCORING_COMPLETED : ActivityKind.AI_SCORING_FAILED)
            .source(ActivitySource.AI)
            .targetType(ActivityTargetType.APPLICATION)
            .targetId(applicationId)
            .targetLabel(targetLabel)
            .description(completed ? "đã hoàn tất xử lý AI" : "xử lý AI đã thất bại")
            .metadata(metadata)
            .build());
  }

  public void recordAiProcessingStarted(
      User actor, UUID applicationId, String targetLabel, UUID runId) {
    activityLogRepository.save(
        ActivityLog.builder()
            .actor(actor)
            .actorName(actor.getFullName())
            .kind(ActivityKind.AI_SCORING_STARTED)
            .source(ActivitySource.ADMIN)
            .targetType(ActivityTargetType.APPLICATION)
            .targetId(applicationId)
            .targetLabel(targetLabel)
            .description("đã yêu cầu chạy lại quy trình AI")
            .metadata(Map.of("runId", runId.toString(), "trigger", "ADMIN_RETRY"))
            .build());
  }

  @Transactional(readOnly = true)
  public List<ActivityResponse> findRecent(int limit) {
    return activityLogRepository
        .findAll(
            PageRequest.of(0, Math.clamp(limit, 1, 20), Sort.by(Sort.Direction.DESC, "createdAt")))
        .getContent()
        .stream()
        .map(this::toResponse)
        .toList();
  }

  private Specification<ActivityLog> buildFilters(
      String search,
      String group,
      ActivityTargetType targetType,
      UUID targetId,
      LocalDateTime from,
      LocalDateTime to) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (search != null && !search.isBlank()) {
        String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        predicates.add(
            cb.or(
                cb.like(cb.lower(root.get("actorName")), keyword),
                cb.like(cb.lower(root.get("description")), keyword),
                cb.like(cb.lower(root.get("targetLabel")), keyword)));
      }
      if (group != null && !group.isBlank() && !"ALL".equalsIgnoreCase(group)) {
        addGroupPredicate(predicates, root, cb, group);
      }
      if (targetType != null) {
        predicates.add(cb.equal(root.get("targetType"), targetType));
      }
      if (targetId != null) {
        predicates.add(cb.equal(root.get("targetId"), targetId));
      }
      if (from != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
      }
      if (to != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  private void addGroupPredicate(
      List<Predicate> predicates,
      jakarta.persistence.criteria.Root<ActivityLog> root,
      jakarta.persistence.criteria.CriteriaBuilder cb,
      String group) {
    switch (group.toUpperCase(Locale.ROOT)) {
      case "ADMIN" ->
          predicates.add(
              root.get("kind")
                  .in(
                      ActivityKind.USER_STATUS_CHANGED,
                      ActivityKind.STAFF_PROFILE_SYNCED,
                      ActivityKind.KNOWLEDGE_CHANGED));
      case "CONTENT" ->
          predicates.add(
              root.get("kind")
                  .in(
                      ActivityKind.JOB_CREATED,
                      ActivityKind.JOB_UPDATED,
                      ActivityKind.JOB_STATUS_CHANGED));
      case "APPLICATION" ->
          predicates.add(
              root.get("kind")
                  .in(ActivityKind.APPLICATION_SUBMITTED, ActivityKind.APPLICATION_STATUS_CHANGED));
      case "AI" -> predicates.add(root.get("kind").in(AI_ACTIVITY_KINDS));
      default -> throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
    }
  }

  private void validateFilters(
      String search,
      String group,
      ActivityTargetType targetType,
      UUID targetId,
      LocalDateTime from,
      LocalDateTime to) {
    if (search != null && search.length() > 100) {
      throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
    }
    if (group != null
        && !group.isBlank()
        && !ACTIVITY_GROUPS.contains(group.toUpperCase(Locale.ROOT))) {
      throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
    }
    if ((targetType == null) != (targetId == null)) {
      throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
    }
    if (from != null && to != null && from.isAfter(to)) {
      throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
    }
  }

  private ActivityResponse toResponse(ActivityLog activity) {
    return new ActivityResponse(
        activity.getId(),
        activity.getKind(),
        activity.getSource(),
        activity.getActorName(),
        activity.getDescription(),
        activity.getTargetType(),
        activity.getTargetId(),
        activity.getTargetLabel(),
        targetHref(activity),
        activity.getCreatedAt());
  }

  private String targetHref(ActivityLog activity) {
    return switch (activity.getTargetType()) {
      case USER -> "/admin/users/" + activity.getTargetId();
      case JOB -> "/admin/jobs/" + activity.getTargetId();
      case APPLICATION -> "/admin/applications/" + activity.getTargetId();
      case KNOWLEDGE -> "/admin/knowledge";
    };
  }
}
