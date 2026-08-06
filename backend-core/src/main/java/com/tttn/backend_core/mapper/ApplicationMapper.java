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
  ApplicationResponse toResponse(Application application);
}
