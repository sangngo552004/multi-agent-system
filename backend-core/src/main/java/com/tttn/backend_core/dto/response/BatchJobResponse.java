package com.tttn.backend_core.dto.response;

import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BatchJobResponse {
  private String id;
  private String status;
  private int totalCount;
  private int processedCount;
  private int successCount;
  private int failedCount;
  private Map<String, Object> payload;
}
