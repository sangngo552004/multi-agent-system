package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.response.AiMasterDataResponse;
import com.tttn.backend_core.entity.CompetencyLevel;
import com.tttn.backend_core.repository.CareerLevelRepository;
import com.tttn.backend_core.repository.CompetencyLevelRepository;
import com.tttn.backend_core.repository.CompetencyRepository;
import com.tttn.backend_core.repository.InstitutionalRuleRepository;
import com.tttn.backend_core.repository.JobFamilyRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AiMasterDataService {

  private final JobFamilyRepository jobFamilyRepository;
  private final CareerLevelRepository careerLevelRepository;
  private final CompetencyRepository competencyRepository;
  private final CompetencyLevelRepository competencyLevelRepository;
  private final InstitutionalRuleRepository institutionalRuleRepository;

  @Transactional(readOnly = true)
  public AiMasterDataResponse getMasterData() {
    var competencies = competencyRepository.findByIsActiveTrueOrderByNameAsc();
    List<UUID> competencyIds = competencies.stream().map(item -> item.getId()).toList();
    Map<UUID, List<CompetencyLevel>> levelsByCompetency =
        competencyIds.isEmpty()
            ? Map.of()
            : competencyLevelRepository.findByCompetencyIds(competencyIds).stream()
                .collect(Collectors.groupingBy(item -> item.getCompetency().getId()));

    return new AiMasterDataResponse(
        jobFamilyRepository.findByIsActiveTrueOrderByNameAsc().stream()
            .map(
                item ->
                    new AiMasterDataResponse.JobFamilyItem(
                        item.getId(), item.getName(), item.getDescription()))
            .toList(),
        careerLevelRepository.findByIsActiveTrueOrderByRankValueAsc().stream()
            .map(
                item ->
                    new AiMasterDataResponse.CareerLevelItem(
                        item.getId(), item.getName(), item.getRankValue(), item.getDescription()))
            .toList(),
        competencies.stream()
            .map(
                item ->
                    new AiMasterDataResponse.CompetencyItem(
                        item.getId(),
                        item.getName(),
                        item.getCategory(),
                        item.getDescription(),
                        levelsByCompetency.getOrDefault(item.getId(), List.of()).stream()
                            .map(
                                level ->
                                    new AiMasterDataResponse.CompetencyLevelItem(
                                        level.getLevel(), level.getLabel(), level.getDescription()))
                            .toList()))
            .toList(),
        institutionalRuleRepository.findByIsActiveTrueOrderByNameAsc().stream()
            .map(
                item ->
                    new AiMasterDataResponse.RuleItem(
                        item.getId(),
                        item.getRuleCode(),
                        item.getName(),
                        item.getDescription(),
                        item.getBonusPoints(),
                        item.getMaxImpactPercent()))
            .toList());
  }
}
