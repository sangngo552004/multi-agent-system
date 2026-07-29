package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.ActivityPageResponse;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.entity.ActivityTargetType;
import com.tttn.backend_core.service.ActivityLogService;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/activities")
@PreAuthorize("hasRole('ADMIN')")
public class AdminActivityController {

  private final ActivityLogService activityLogService;

  public AdminActivityController(ActivityLogService activityLogService) {
    this.activityLogService = activityLogService;
  }

  @GetMapping
  public ApiResponse<ActivityPageResponse> findAll(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String group,
      @RequestParam(required = false) ActivityTargetType targetType,
      @RequestParam(required = false) UUID targetId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime to,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return ApiResponse.success(
        activityLogService.findAll(search, group, targetType, targetId, from, to, page, size));
  }
}
