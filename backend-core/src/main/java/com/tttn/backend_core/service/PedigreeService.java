package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.PedigreeRequest;
import com.tttn.backend_core.dto.response.PedigreeResponse;
import com.tttn.backend_core.entity.PedigreeEntity;
import com.tttn.backend_core.entity.PedigreeType;
import com.tttn.backend_core.repository.PedigreeRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service quản lý danh sách tổ chức (trường ĐH, công ty) cho Knowledge Base. HR có thể thêm/sửa/xóa
 * tổ chức qua API này thay vì hardcode trong AI service.
 */
@Service
public class PedigreeService {

  private final PedigreeRepository pedigreeRepository;

  public PedigreeService(PedigreeRepository pedigreeRepository) {
    this.pedigreeRepository = pedigreeRepository;
  }

  /** Lấy tất cả tổ chức đang hoạt động. */
  public List<PedigreeResponse> getAll() {
    return pedigreeRepository.findByIsActiveTrueOrderByRankAscNameAsc().stream()
        .map(this::toResponse)
        .toList();
  }

  /** Lấy tổ chức theo loại (UNIVERSITY, COMPANY, AGENCY). */
  public List<PedigreeResponse> getByType(PedigreeType type) {
    return pedigreeRepository.findByTypeAndIsActiveTrue(type).stream()
        .map(this::toResponse)
        .toList();
  }

  /** Tạo tổ chức mới. */
  @Transactional
  public PedigreeResponse create(PedigreeRequest request) {
    if (pedigreeRepository.existsByNameIgnoreCase(request.getName())) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Tổ chức với tên '" + request.getName() + "' đã tồn tại.");
    }

    PedigreeEntity entity =
        PedigreeEntity.builder()
            .name(request.getName())
            .type(request.getType())
            .rank(request.getRank())
            .domain(request.getDomain() != null ? request.getDomain() : "ALL")
            .country(request.getCountry() != null ? request.getCountry() : "VN")
            .isActive(true)
            .build();

    return toResponse(pedigreeRepository.save(entity));
  }

  /** Cập nhật tổ chức. */
  @Transactional
  public PedigreeResponse update(UUID id, PedigreeRequest request) {
    PedigreeEntity entity = findOrThrow(id);
    entity.setName(request.getName());
    entity.setType(request.getType());
    entity.setRank(request.getRank());
    entity.setDomain(request.getDomain() != null ? request.getDomain() : "ALL");
    entity.setCountry(request.getCountry() != null ? request.getCountry() : "VN");
    return toResponse(pedigreeRepository.save(entity));
  }

  /**
   * Soft delete — đánh dấu is_active = false thay vì xóa hẳn. Giữ lại history nếu entity đã được
   * dùng trong past applications.
   */
  @Transactional
  public void deactivate(UUID id) {
    PedigreeEntity entity = findOrThrow(id);
    entity.setIsActive(false);
    pedigreeRepository.save(entity);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private PedigreeEntity findOrThrow(UUID id) {
    return pedigreeRepository
        .findById(id)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Không tìm thấy tổ chức với id: " + id));
  }

  private PedigreeResponse toResponse(PedigreeEntity e) {
    return PedigreeResponse.builder()
        .id(e.getId())
        .name(e.getName())
        .type(e.getType())
        .rank(e.getRank())
        .domain(e.getDomain())
        .country(e.getCountry())
        .isActive(e.getIsActive())
        .createdAt(e.getCreatedAt())
        .build();
  }
}
