package com.tttn.backend_core.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

/**
 * Response cho một bậc năng lực (CompetencyLevel). Trả về label + description để frontend hiển thị
 * và AI service nhúng vào prompt.
 */
@Data
@Builder
public class CompetencyLevelResponse {
  private UUID id;
  private UUID competencyId;
  private String competencyName;
  private Integer level;

  /** Nhãn ngắn gọn, ví dụ: "Thành thạo" */
  private String label;

  /** Mô tả chi tiết kỳ vọng tại bậc này */
  private String description;

  private LocalDateTime createdAt;
}
