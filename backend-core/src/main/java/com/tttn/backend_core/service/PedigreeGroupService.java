package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.PedigreeGroupRequest;
import com.tttn.backend_core.dto.response.PedigreeGroupResponse;
import com.tttn.backend_core.entity.PedigreeEntity;
import com.tttn.backend_core.entity.PedigreeGroup;
import com.tttn.backend_core.repository.PedigreeGroupRepository;
import com.tttn.backend_core.repository.PedigreeRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PedigreeGroupService {
  private final PedigreeGroupRepository groupRepository;
  private final PedigreeRepository pedigreeRepository;

  @Transactional(readOnly = true)
  public List<PedigreeGroupResponse> findAll() {
    return groupRepository.findAll().stream().map(this::toResponse).toList();
  }

  @Transactional
  public PedigreeGroupResponse save(UUID id, PedigreeGroupRequest request) {
    PedigreeGroup group =
        id == null ? new PedigreeGroup() : groupRepository.findById(id).orElseThrow();
    group.setCode(request.getCode().trim().toUpperCase(java.util.Locale.ROOT));
    group.setName(request.getName().trim());
    group.setEvidenceSource(request.getEvidenceSource());
    group.setIsActive(true);
    group.setMembers(pedigreeRepository.findAllById(request.getMemberIds()));
    return toResponse(groupRepository.save(group));
  }

  private PedigreeGroupResponse toResponse(PedigreeGroup group) {
    return PedigreeGroupResponse.builder()
        .id(group.getId())
        .code(group.getCode())
        .name(group.getName())
        .evidenceSource(group.getEvidenceSource())
        .isActive(Boolean.TRUE.equals(group.getIsActive()))
        .memberIds(group.getMembers().stream().map(PedigreeEntity::getId).toList())
        .build();
  }
}
