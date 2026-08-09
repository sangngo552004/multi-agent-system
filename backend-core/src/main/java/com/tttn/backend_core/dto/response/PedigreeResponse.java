package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.PedigreeRank;
import com.tttn.backend_core.entity.PedigreeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PedigreeResponse {
  private UUID id;
  private String name;
  private PedigreeType type;
  private PedigreeRank rank;
  private String domain;
  private String country;
  private List<String> aliases;
  private Boolean isActive;
  private LocalDateTime createdAt;
}
