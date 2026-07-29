package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.UserStatusRequest;
import com.tttn.backend_core.dto.response.AdminUserResponse;
import com.tttn.backend_core.dto.response.PageResponse;
import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.entity.User;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.JobRepository;
import com.tttn.backend_core.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.HashMap;
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
public class AdminUserService {

  private static final Set<String> SORT_FIELDS =
      Set.of("fullName", "email", "role", "createdAt", "lastActiveAt");

  private final UserRepository userRepository;
  private final JobRepository jobRepository;
  private final ApplicationRepository applicationRepository;
  private final ActivityLogService activityLogService;
  private final RefreshTokenService refreshTokenService;

  public AdminUserService(
      UserRepository userRepository,
      JobRepository jobRepository,
      ApplicationRepository applicationRepository,
      ActivityLogService activityLogService,
      RefreshTokenService refreshTokenService) {
    this.userRepository = userRepository;
    this.jobRepository = jobRepository;
    this.applicationRepository = applicationRepository;
    this.activityLogService = activityLogService;
    this.refreshTokenService = refreshTokenService;
  }

  @Transactional(readOnly = true)
  public PageResponse<AdminUserResponse> findAll(
      String search, Role role, String status, int page, int size, String sort) {
    validateSearch(search);
    validateStatusFilter(status);
    Page<User> users =
        userRepository.findAll(
            buildFilters(search, role, status),
            PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), parseSort(sort)));
    List<UUID> ids = users.getContent().stream().map(User::getId).toList();
    Map<UUID, Long> jobCounts = groupCounts(ids, true);
    Map<UUID, Long> applicationCounts = groupCounts(ids, false);
    List<AdminUserResponse> items =
        users.getContent().stream()
            .map(
                user ->
                    toResponse(
                        user,
                        jobCounts.getOrDefault(user.getId(), 0L),
                        applicationCounts.getOrDefault(user.getId(), 0L)))
            .toList();
    return PageResponse.from(users, items);
  }

  @Transactional(readOnly = true)
  public AdminUserResponse findById(UUID id) {
    User user =
        userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    long jobs =
        user.getRole() == Role.HR
            ? jobRepository.countByHrIds(List.of(id)).stream()
                .mapToLong(row -> (Long) row[1])
                .findFirst()
                .orElse(0)
            : 0;
    long applications =
        user.getRole() == Role.CANDIDATE
            ? applicationRepository.countByCandidateIds(List.of(id)).stream()
                .mapToLong(row -> (Long) row[1])
                .findFirst()
                .orElse(0)
            : 0;
    return toResponse(user, jobs, applications);
  }

  @Transactional
  public AdminUserResponse updateStatus(UUID id, UserStatusRequest request, String actorEmail) {
    User actor =
        userRepository
            .findByEmail(actorEmail)
            .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    User target =
        userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    boolean active = request.status() == UserStatusRequest.AccountStatus.ACTIVE;
    if (actor.getId().equals(target.getId()) && !active) {
      throw new AppException(ErrorCode.USER_SELF_BLOCK_FORBIDDEN);
    }

    target.setActive(active);
    target.setBlockReason(active ? null : request.reason().trim());
    userRepository.save(target);
    if (!active) {
      refreshTokenService.revokeAll(target);
    }
    activityLogService.recordUserStatusChanged(
        actor, target, request.status().name(), request.reason());
    return findById(id);
  }

  private Specification<User> buildFilters(String search, Role role, String status) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (search != null && !search.isBlank()) {
        String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        predicates.add(
            cb.or(
                cb.like(cb.lower(root.get("fullName")), keyword),
                cb.like(cb.lower(root.get("email")), keyword)));
      }
      if (role != null) {
        predicates.add(cb.equal(root.get("role"), role));
      }
      if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
        predicates.add(cb.equal(root.get("isActive"), "ACTIVE".equalsIgnoreCase(status)));
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }

  private void validateStatusFilter(String status) {
    if (status == null
        || status.isBlank()
        || "ALL".equalsIgnoreCase(status)
        || "ACTIVE".equalsIgnoreCase(status)
        || "BLOCKED".equalsIgnoreCase(status)) {
      return;
    }
    throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
  }

  private void validateSearch(String search) {
    if (search != null && search.length() > 100) {
      throw new AppException(ErrorCode.INVALID_ADMIN_FILTER);
    }
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

  private Map<UUID, Long> groupCounts(List<UUID> ids, boolean jobs) {
    if (ids.isEmpty()) {
      return Map.of();
    }
    List<Object[]> rows =
        jobs ? jobRepository.countByHrIds(ids) : applicationRepository.countByCandidateIds(ids);
    Map<UUID, Long> result = new HashMap<>();
    rows.forEach(row -> result.put((UUID) row[0], (Long) row[1]));
    return result;
  }

  private AdminUserResponse toResponse(User user, long jobs, long applications) {
    return new AdminUserResponse(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        user.getRole(),
        user.isActive() ? "ACTIVE" : "BLOCKED",
        user.getEmployeeCode(),
        user.getDepartmentName(),
        user.getJobTitle(),
        user.getWorkLocation(),
        user.getCreatedAt(),
        user.getLastActiveAt(),
        jobs,
        applications,
        user.getBlockReason());
  }
}
