package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Luật thưởng điểm (Institutional Rule) được áp dụng khi chấm điểm ứng viên.
 *
 * <p>Thay thế cấu trúc JSONB tự do trong bảng jobs.institutional_rules. Các rule được quản lý tập
 * trung, reuse được giữa nhiều Job, và bonus_points cùng max_impact_percent được ghi rõ để HR hiểu
 * tác động thực tế.
 *
 * <p>Ví dụ rule: rule_code = "TIER_1_SCHOOL_BONUS" bonus_points = 15.0 → điểm thô cộng vào
 * bonus_score max_impact_percent = 20.0 → tối đa bonus ảnh hưởng 20% vào overall_score
 */
@Entity
@Table(name = "institutional_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionalRule {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  /**
   * Mã định danh logic của rule, dùng trong Scoring Engine. Ví dụ: "TIER_1_SCHOOL_BONUS",
   * "TIER_2_SCHOOL_BONUS", "TIER_1_COMPANY_BONUS".
   */
  @Column(name = "rule_code", nullable = false, unique = true, length = 100)
  private String ruleCode;

  /** Tên hiển thị thân thiện với HR. */
  @Column(nullable = false, length = 255)
  private String name;

  @Column(columnDefinition = "TEXT")
  private String description;

  /**
   * Điểm bonus thô (0–100) được cộng vào bonus_score khi rule triggered. Tác động thực tế vào
   * overall = bonus_points * (max_impact_percent / 100).
   */
  @Column(name = "bonus_points", nullable = false, precision = 5, scale = 2)
  @Builder.Default
  private BigDecimal bonusPoints = BigDecimal.ZERO;

  /**
   * % tối đa mà bonus có thể tác động vào overall_score. Ví dụ: 20.0 → bonus chỉ được đóng góp tối
   * đa 20 điểm vào overall (thang 100). Giúp HR hiểu rõ trọng lượng thực tế khi cấu hình rule.
   */
  @Column(name = "max_impact_percent", nullable = false, precision = 5, scale = 2)
  @Builder.Default
  private BigDecimal maxImpactPercent = new BigDecimal("20.00");

  /** Domain áp dụng rule, ví dụ: "ENGINEERING", "SALES_MARKETING", "ALL". */
  @Column(name = "applies_to_domain", nullable = false, length = 100)
  @Builder.Default
  private String appliesToDomain = "ALL";

  @Column(name = "is_active", nullable = false)
  @Builder.Default
  private Boolean isActive = true;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
