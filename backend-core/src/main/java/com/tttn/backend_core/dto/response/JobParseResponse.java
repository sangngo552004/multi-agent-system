package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.dto.request.JobCompetencyRequest;
import com.tttn.backend_core.dto.request.JobRequest;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobParseResponse {
  private JobRequest jobInfo;
  private List<JobCompetencyRequest> competencies;
}
