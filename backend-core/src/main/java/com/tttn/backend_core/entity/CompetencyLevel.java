package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Định nghĩa ngữ nghĩa (label + mô tả) cho từng bậc (level) của một Competency. Ví dụ: Competency
 * "Java", level=3 → label="Thành thạo", description="Có thể xây dựng REST API độc lập".
 */
@Entity
@Table(
    name = "competency_levels",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"competency_id", "level"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompetencyLevel {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "competency_id", nullable = false)
  private Competency competency;

  /**
   * Bậc năng lực, từ 1 (cơ bản) đến 5 (chuyên gia). Tương ứng với required_level trong
   * JobCompetency.
   */
  @Column(nullable = false)
  private Integer level;

  /** Nhãn ngắn gọn cho bậc này, ví dụ: "Cơ bản", "Thành thạo", "Chuyên gia". */
  @Column(nullable = false, length = 100)
  private String label;

  /**
   * Mô tả chi tiết kỳ vọng tại bậc này. Ví dụ: level=3 Java → "Có thể thiết kế và xây dựng REST API
   * độc lập, hiểu Spring IoC."
   */
  @Column(columnDefinition = "TEXT")
  private String description;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
