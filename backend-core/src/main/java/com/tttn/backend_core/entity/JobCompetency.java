package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "job_competencies",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"job_id", "competency_id"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCompetency {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "job_id", nullable = false)
  private Job job;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "competency_id", nullable = false)
  private Competency competency;

  @Column(nullable = false)
  private Double weight;

  @Column(name = "required_level", nullable = false)
  @Builder.Default
  private Integer requiredLevel = 1;

  /**
   * Nếu true: ứng viên không đáp ứng competency này sẽ bị loại ngay (Knockout). Tương ứng với
   * is_mandatory trong AI service schemas.
   */
  @Column(name = "is_mandatory", nullable = false)
  @Builder.Default
  private Boolean isMandatory = false;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
