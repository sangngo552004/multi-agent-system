package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.JobStatus;
import java.util.List;
import java.util.Map;

public record AdminJobListResponse(
    List<AdminJobResponse> items,
    Map<JobStatus, Long> statusCounts,
    int page,
    int size,
    long totalItems,
    int totalPages,
    boolean first,
    boolean last) {}
