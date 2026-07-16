package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.request.PedigreeRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.PedigreeResponse;
import com.tttn.backend_core.entity.PedigreeType;
import com.tttn.backend_core.service.PedigreeService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * API quản lý Knowledge Base — danh sách tổ chức (trường ĐH, công ty, agency) được xếp hạng dùng
 * trong Institutional Rules.
 *
 * <p>Endpoints: GET /api/knowledge-base/pedigrees — Lấy tất cả (có thể lọc theo type) POST
 * /api/knowledge-base/pedigrees — Thêm tổ chức mới (HR) PUT /api/knowledge-base/pedigrees/{id} —
 * Cập nhật DELETE /api/knowledge-base/pedigrees/{id} — Soft delete (is_active=false)
 *
 * <p>AI Service cũng đọc endpoint GET này để load KB thay vì hardcode.
 */
@RestController
@RequestMapping("/api/knowledge-base")
public class KnowledgeBaseController {

  private final PedigreeService pedigreeService;

  public KnowledgeBaseController(PedigreeService pedigreeService) {
    this.pedigreeService = pedigreeService;
  }

  /**
   * Lấy danh sách tổ chức, tùy chọn lọc theo type. AI Service gọi endpoint này khi startup để load
   * KB vào memory.
   *
   * <p>GET /api/knowledge-base/pedigrees GET /api/knowledge-base/pedigrees?type=UNIVERSITY
   */
  @GetMapping("/pedigrees")
  public ApiResponse<List<PedigreeResponse>> getAll(
      @RequestParam(required = false) PedigreeType type) {
    if (type != null) {
      return ApiResponse.success(pedigreeService.getByType(type));
    }
    return ApiResponse.success(pedigreeService.getAll());
  }

  /**
   * Thêm tổ chức mới vào KB. Ví dụ body: { "name": "Trường Đại học ABC", "type": "UNIVERSITY",
   * "rank": "TIER_2", "domain": "ALL", "country": "VN" }
   */
  @PostMapping("/pedigrees")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<PedigreeResponse> create(@Valid @RequestBody PedigreeRequest request) {
    return ApiResponse.success(pedigreeService.create(request));
  }

  /** Cập nhật thông tin tổ chức (ví dụ: thay đổi rank từ TIER_2 lên TIER_1). */
  @PutMapping("/pedigrees/{id}")
  public ApiResponse<PedigreeResponse> update(
      @PathVariable UUID id, @Valid @RequestBody PedigreeRequest request) {
    return ApiResponse.success(pedigreeService.update(id, request));
  }

  /**
   * Soft-delete tổ chức (is_active = false). Không xóa hẳn để giữ audit history của các đợt tuyển
   * dụng cũ.
   */
  @DeleteMapping("/pedigrees/{id}")
  public ApiResponse<String> deactivate(@PathVariable UUID id) {
    pedigreeService.deactivate(id);
    return ApiResponse.success("Tổ chức đã được vô hiệu hóa khỏi Knowledge Base.");
  }
}
