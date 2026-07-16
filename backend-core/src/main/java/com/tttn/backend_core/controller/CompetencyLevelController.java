package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.CompetencyLevelResponse;
import com.tttn.backend_core.service.CompetencyLevelService;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API tra cứu ngữ nghĩa bậc năng lực (CompetencyLevel).
 *
 * <p>Endpoints: GET /api/competencies/{competencyId}/levels → Trả về tất cả bậc (1-5) kèm
 * label+description cho một competency. Frontend dùng để hiển thị dropdown khi HR chọn
 * required_level.
 *
 * <p>GET /api/competencies/{competencyId}/levels/{level} → Tra cứu một bậc cụ thể. AI Service gọi
 * để nhúng description vào LLM prompt.
 */
@RestController
@RequestMapping("/api/competencies")
public class CompetencyLevelController {

  private final CompetencyLevelService competencyLevelService;

  public CompetencyLevelController(CompetencyLevelService competencyLevelService) {
    this.competencyLevelService = competencyLevelService;
  }

  /**
   * Lấy tất cả bậc năng lực của một competency (dùng cho frontend dropdown).
   *
   * <p>Ví dụ response: [ { level: 1, label: "Cơ bản", description: "Hiểu cú pháp Java cơ bản..." },
   * { level: 3, label: "Thành thạo", description: "Xây dựng được REST API..." }, ... ]
   */
  @GetMapping("/{competencyId}/levels")
  public ApiResponse<List<CompetencyLevelResponse>> getLevels(@PathVariable UUID competencyId) {
    return ApiResponse.success(competencyLevelService.getByCompetency(competencyId));
  }

  /**
   * Tra cứu một bậc cụ thể (AI Service dùng để nhúng vào LLM prompt).
   *
   * <p>Ví dụ: GET /api/competencies/{java-uuid}/levels/3 → { label: "Thành thạo", description: "Có
   * thể xây dựng REST API độc lập..." }
   */
  @GetMapping("/{competencyId}/levels/{level}")
  public ApiResponse<CompetencyLevelResponse> getOneLevel(
      @PathVariable UUID competencyId, @PathVariable Integer level) {
    return ApiResponse.success(competencyLevelService.getOne(competencyId, level));
  }
}
