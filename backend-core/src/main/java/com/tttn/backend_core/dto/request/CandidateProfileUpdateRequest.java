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
  private java.util.List<String> skills;
  private java.util.List<Map<String, Object>> experience;
  private java.util.List<Map<String, Object>> education;
}
