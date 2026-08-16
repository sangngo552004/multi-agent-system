package com.tttn.backend_core.mapper;

import com.tttn.backend_core.dto.request.InstitutionalRuleRequest;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.entity.CareerLevel;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.entity.InstitutionalRule;
import com.tttn.backend_core.entity.JobFamily;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface MasterDataMapper {

  // JobFamily
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "isActive", constant = "true")
  @Mapping(target = "createdAt", ignore = true)
  JobFamily toJobFamily(MasterDataRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "isActive", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  void updateJobFamily(MasterDataRequest request, @MappingTarget JobFamily entity);

  // CareerLevel
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "isActive", constant = "true")
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "rankValue", ignore = true)
  CareerLevel toCareerLevel(MasterDataRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "isActive", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "rankValue", ignore = true)
  void updateCareerLevel(MasterDataRequest request, @MappingTarget CareerLevel entity);

  // Competency
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "isActive", constant = "true")
  @Mapping(target = "createdAt", ignore = true)
  Competency toCompetency(MasterDataRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "isActive", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  void updateCompetency(MasterDataRequest request, @MappingTarget Competency entity);

  // InstitutionalRule
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "isActive", constant = "true")
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  InstitutionalRule toRule(InstitutionalRuleRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "isActive", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  void updateRule(InstitutionalRuleRequest request, @MappingTarget InstitutionalRule entity);
}
