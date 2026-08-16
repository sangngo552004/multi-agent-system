package com.tttn.backend_core.mapper;

import com.tttn.backend_core.dto.response.ApplicationResponse;
import com.tttn.backend_core.entity.Application;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ApplicationMapper {

  @Mapping(source = "candidate.id", target = "candidateId")
  @Mapping(source = "candidate.fullName", target = "candidateName")
  @Mapping(source = "candidate.email", target = "candidateEmail")
  @Mapping(source = "job.id", target = "jobId")
  @Mapping(source = "job.title", target = "jobTitle")
  @Mapping(source = "job.location", target = "jobLocation")
  @Mapping(source = "job.departmentName", target = "departmentName")
  @Mapping(target = "careerPathReady", expression = "java(hasCandidateCareerPath(application))")
  @Mapping(
      target = "careerPathNotApplicable",
      expression = "java(hasNoLearnableGapsCareerPath(application))")
  ApplicationResponse toResponse(Application application);

  default boolean hasCandidateCareerPath(Application application) {
    if (application.getScoringBreakdown() == null) {
      return false;
    }
    Object result = application.getScoringBreakdown().get("career_path_result");
    return result instanceof java.util.Map<?, ?> resultMap
        && resultMap.get("candidate_view") instanceof java.util.Map<?, ?>;
  }

  default boolean hasNoLearnableGapsCareerPath(Application application) {
    if (application.getScoringBreakdown() == null) {
      return false;
    }
    Object result = application.getScoringBreakdown().get("career_path_result");
    if (!(result instanceof java.util.Map<?, ?> resultMap)
        || !"NOT_APPLICABLE".equals(String.valueOf(resultMap.get("status")))) {
      return false;
    }
    Object diagnostics = resultMap.get("diagnostics");
    return diagnostics instanceof java.util.Map<?, ?> diagnosticsMap
        && "NO_LEARNABLE_GAPS".equals(String.valueOf(diagnosticsMap.get("fallback_reason")));
  }
}
