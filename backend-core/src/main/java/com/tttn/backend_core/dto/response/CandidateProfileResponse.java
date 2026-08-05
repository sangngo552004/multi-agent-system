package com.tttn.backend_core.dto.response;

import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfileResponse {
  private UUID userId;
  private String email;
  private String fullName;
  private java.util.List<String> skills;
  private java.util.List<Map<String, Object>> experience;
  private java.util.List<Map<String, Object>> education;
}
