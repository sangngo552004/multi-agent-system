package com.tttn.backend_core.dto.response;

import java.util.List;

public record ActivityPageResponse(
    List<ActivityResponse> items,
    int page,
    int size,
    long totalItems,
    int totalPages,
    boolean first,
    boolean last,
    ActivitySummary summary) {

  public record ActivitySummary(long total, long last24Hours, long aiRelated) {}
}
