package com.tttn.backend_core.service;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.entity.CompetencyLevel;
import com.tttn.backend_core.entity.QCompetency;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.CompetencyLevelRepository;
import com.tttn.backend_core.repository.CompetencyRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompetencyService {
  private final CompetencyRepository competencyRepository;
  private final CompetencyLevelRepository competencyLevelRepository;
  private final com.tttn.backend_core.mapper.MasterDataMapper masterDataMapper;

  @Transactional(readOnly = true)
  public Page<Competency> findAll(Predicate predicate, Pageable pageable) {
    QCompetency q = QCompetency.competency;
    Predicate activePredicate = q.isActive.eq(true);
    Predicate finalPredicate =
        predicate != null ? ExpressionUtils.allOf(predicate, activePredicate) : activePredicate;
    return competencyRepository.findAll(finalPredicate, pageable);
  }

  @Transactional
  public Competency createCompetency(MasterDataRequest request) {
    if (request.getCategory() == null || request.getCategory().isBlank()) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
    Competency competency = masterDataMapper.toCompetency(request);
    competency.setCategory(request.getCategory().trim());
    Competency saved = competencyRepository.save(competency);
    competencyLevelRepository.saveAll(defaultLevels(saved));
    return saved;
  }

  @Transactional
  public Competency updateCompetency(UUID id, MasterDataRequest request) {
    Competency competency =
        competencyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.COMPETENCY_NOT_FOUND));
    if (!competency.getIsActive()) {
      throw new AppException(ErrorCode.COMPETENCY_NOT_FOUND);
    }
    if (request.getCategory() == null || request.getCategory().isBlank()) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
    masterDataMapper.updateCompetency(request, competency);
    competency.setCategory(request.getCategory().trim());
    return competencyRepository.save(competency);
  }

  @Transactional
  public void deleteCompetency(UUID id) {
    Competency competency =
        competencyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.COMPETENCY_NOT_FOUND));
    if (!competency.getIsActive()) {
      throw new AppException(ErrorCode.COMPETENCY_NOT_FOUND);
    }
    competency.setIsActive(false);
    competency.setName(competency.getName() + " - deleted_" + System.currentTimeMillis());
    competencyRepository.save(competency);
  }

  private List<CompetencyLevel> defaultLevels(Competency competency) {
    List<String> titles = List.of("Cơ bản", "Thực hành", "Độc lập", "Thành thạo", "Chuyên gia");
    return java.util.stream.IntStream.rangeClosed(1, 5)
        .mapToObj(
            level ->
                CompetencyLevel.builder()
                    .competency(competency)
                    .level(level)
                    .label(titles.get(level - 1))
                    .description("Chưa cấu hình mô tả cho cấp độ này.")
                    .build())
        .toList();
  }
}
