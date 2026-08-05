package com.tttn.backend_core.dto.request;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfileUpdateRequest {
  private Map<String, Object> skills;
  private Map<String, Object> experience;
  private Map<String, Object> education;
}
