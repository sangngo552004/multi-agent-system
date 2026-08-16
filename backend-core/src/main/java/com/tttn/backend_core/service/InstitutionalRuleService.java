package com.tttn.backend_core.service;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.InstitutionalRuleRequest;
import com.tttn.backend_core.dto.response.InstitutionalRuleResponse;
import com.tttn.backend_core.entity.InstitutionalRule;
import com.tttn.backend_core.entity.QInstitutionalRule;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.InstitutionalRuleRepository;
import com.tttn.backend_core.repository.JobFamilyRepository;
import com.tttn.backend_core.repository.PedigreeGroupRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InstitutionalRuleService {
  private final InstitutionalRuleRepository institutionalRuleRepository;
  private final PedigreeGroupRepository pedigreeGroupRepository;
  private final JobFamilyRepository jobFamilyRepository;
  private final com.tttn.backend_core.mapper.MasterDataMapper masterDataMapper;

  @Transactional(readOnly = true)
  public Page<InstitutionalRuleResponse> findAll(Predicate predicate, Pageable pageable) {
    QInstitutionalRule q = QInstitutionalRule.institutionalRule;
    Predicate activePredicate = q.isActive.eq(true);
    Predicate finalPredicate =
        predicate != null ? ExpressionUtils.allOf(predicate, activePredicate) : activePredicate;
    return institutionalRuleRepository.findAll(finalPredicate, pageable).map(this::toResponse);
  }

  @Transactional
  public InstitutionalRuleResponse createRule(InstitutionalRuleRequest request) {
    InstitutionalRule entity = masterDataMapper.toRule(request);
    applyRelations(entity, request);
    return toResponse(institutionalRuleRepository.save(entity));
  }

  @Transactional
  public InstitutionalRuleResponse updateRule(UUID id, InstitutionalRuleRequest request) {
    InstitutionalRule entity =
        institutionalRuleRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
    if (!entity.getIsActive()) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
    masterDataMapper.updateRule(request, entity);
    applyRelations(entity, request);
    return toResponse(institutionalRuleRepository.save(entity));
  }

  @Transactional
  public void deleteRule(UUID id) {
    InstitutionalRule entity =
        institutionalRuleRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
    if (!entity.getIsActive()) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
    entity.setIsActive(false);
    entity.setRuleCode(entity.getRuleCode() + "_deleted_" + System.currentTimeMillis());
    institutionalRuleRepository.save(entity);
  }

  private void applyRelations(InstitutionalRule entity, InstitutionalRuleRequest request) {
    entity.setPedigreeGroup(
        pedigreeGroupRepository
            .findById(request.getPedigreeGroupId())
            .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION)));
    entity.setJobFamilies(
        request.getJobFamilyIds() == null
            ? java.util.List.of()
            : jobFamilyRepository.findAllById(request.getJobFamilyIds()));
  }

  private InstitutionalRuleResponse toResponse(InstitutionalRule rule) {
    InstitutionalRuleResponse.PedigreeGroupItem group =
        rule.getPedigreeGroup() == null
            ? null
            : new InstitutionalRuleResponse.PedigreeGroupItem(
                rule.getPedigreeGroup().getId(),
                rule.getPedigreeGroup().getCode(),
                rule.getPedigreeGroup().getName(),
                rule.getPedigreeGroup().getEvidenceSource());
    return new InstitutionalRuleResponse(
        rule.getId(),
        rule.getRuleCode(),
        rule.getName(),
        rule.getDescription(),
        rule.getBonusPoints(),
        rule.getMaxImpactPercent(),
        rule.getAppliesToDomain(),
        group,
        rule.getJobFamilies().stream()
            .map(
                family ->
                    new InstitutionalRuleResponse.JobFamilyItem(
                        family.getId(),
                        family.getName(),
                        family.getDescription(),
                        Boolean.TRUE.equals(family.getIsActive())))
            .toList(),
        Boolean.TRUE.equals(rule.getIsActive()));
  }
}
