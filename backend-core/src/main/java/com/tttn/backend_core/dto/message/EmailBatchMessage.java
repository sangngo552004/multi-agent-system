package com.tttn.backend_core.dto.message;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailBatchMessage {
  private List<UUID> chunkIds;
  private String action; // INVITE or REJECT
  private String batchId; // UUID for tracking the batch job
}
