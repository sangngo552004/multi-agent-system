package com.tttn.backend_core.service;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.InstitutionalRuleRequest;
import com.tttn.backend_core.entity.InstitutionalRule;
import com.tttn.backend_core.entity.QInstitutionalRule;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.InstitutionalRuleRepository;
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

  @Transactional(readOnly = true)
  public Page<InstitutionalRule> findAll(Predicate predicate, Pageable pageable) {
    QInstitutionalRule q = QInstitutionalRule.institutionalRule;
    Predicate activePredicate = q.isActive.eq(true);
    Predicate finalPredicate =
        predicate != null ? ExpressionUtils.allOf(predicate, activePredicate) : activePredicate;
    return institutionalRuleRepository.findAll(finalPredicate, pageable);
  }

  @Transactional
  public InstitutionalRule createRule(InstitutionalRuleRequest request) {
    InstitutionalRule entity = new InstitutionalRule();
    entity.setRuleCode(request.getRuleCode());
    entity.setName(request.getName());
    entity.setDescription(request.getDescription());
    entity.setBonusPoints(request.getBonusPoints());
    entity.setMaxImpactPercent(request.getMaxImpactPercent());
    entity.setAppliesToDomain(request.getAppliesToDomain());
    entity.setIsActive(true);
    return institutionalRuleRepository.save(entity);
  }

  @Transactional
  public InstitutionalRule updateRule(UUID id, InstitutionalRuleRequest request) {
    InstitutionalRule entity =
        institutionalRuleRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
    if (!entity.getIsActive()) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
    entity.setRuleCode(request.getRuleCode());
    entity.setName(request.getName());
    entity.setDescription(request.getDescription());
    entity.setBonusPoints(request.getBonusPoints());
    entity.setMaxImpactPercent(request.getMaxImpactPercent());
    entity.setAppliesToDomain(request.getAppliesToDomain());
    return institutionalRuleRepository.save(entity);
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
}
