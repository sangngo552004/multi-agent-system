package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.response.CompetencyLevelResponse;
import com.tttn.backend_core.entity.CompetencyLevel;
import com.tttn.backend_core.repository.CompetencyLevelRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service tra cứu ngữ nghĩa của các bậc năng lực (CompetencyLevel).
 *
 * <p>Được dùng bởi: 1. Frontend — hiển thị mô tả level khi HR tạo job (required_level dropdown) 2.
 * AI Service (qua API) — nhúng label+description vào prompt để LLM đánh giá đúng cấp độ
 */
@Service
public class CompetencyLevelService {

  private final CompetencyLevelRepository repo;

  public CompetencyLevelService(CompetencyLevelRepository repo) {
    this.repo = repo;
  }

  /** Trả về tất cả bậc của một competency, thứ tự 1→5. */
  public List<CompetencyLevelResponse> getByCompetency(UUID competencyId) {
    return repo.findByCompetencyIdOrderByLevelAsc(competencyId).stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Trả về ngữ nghĩa của một bậc cụ thể. AI Service gọi endpoint này để lấy description nhúng vào
   * prompt.
   *
   * <p>Ví dụ: competencyId=Java-uuid, level=3 → label="Thành thạo", description="Có thể xây dựng
   * REST API độc lập..."
   */
  public CompetencyLevelResponse getOne(UUID competencyId, Integer level) {
    return repo.findByCompetencyIdAndLevel(competencyId, level)
        .map(this::toResponse)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    String.format("Không tìm thấy bậc %d cho competency %s", level, competencyId)));
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private CompetencyLevelResponse toResponse(CompetencyLevel cl) {
    return CompetencyLevelResponse.builder()
        .id(cl.getId())
        .competencyId(cl.getCompetency().getId())
        .competencyName(cl.getCompetency().getName())
        .level(cl.getLevel())
        .label(cl.getLabel())
        .description(cl.getDescription())
        .createdAt(cl.getCreatedAt())
        .build();
  }
}
