package com.tttn.backend_core.mapper;

import com.tttn.backend_core.dto.request.JobRequest;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.entity.Job;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface JobMapper {

  @Mapping(source = "jobFamily.id", target = "jobFamilyId")
  @Mapping(source = "jobFamily.name", target = "jobFamilyName")
  @Mapping(source = "careerLevel.id", target = "careerLevelId")
  @Mapping(source = "careerLevel.name", target = "careerLevelName")
  @Mapping(source = "requiredCompetencies", target = "competencies")
  JobResponse toResponse(Job job);

  default JobResponse.JobCompetencyResponse toCompetencyResponse(
      com.tttn.backend_core.entity.JobCompetency jc) {
    if (jc == null || jc.getCompetency() == null) return null;
    return JobResponse.JobCompetencyResponse.builder()
        .competencyId(jc.getCompetency().getId())
        .name(jc.getCompetency().getName())
        .requiredLevel(jc.getRequiredLevel())
        .weight(jc.getWeight())
        .isMandatory(jc.getIsMandatory())
        .build();
  }

  @Mapping(target = "jobFamily", ignore = true)
  @Mapping(target = "careerLevel", ignore = true)
  @Mapping(target = "hr", ignore = true)
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "institutionalRules", ignore = true)
  @Mapping(target = "requiredCompetencies", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "status", ignore = true)
  void updateEntity(JobRequest request, @MappingTarget Job job);
}
