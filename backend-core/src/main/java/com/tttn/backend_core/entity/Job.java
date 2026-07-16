package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "hr_id", nullable = false)
  private User hr;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String location;

  @Enumerated(EnumType.STRING)
  @Column(name = "employment_type", nullable = false)
  private EmploymentType employmentType;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String description;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String requirements;

  @Column(columnDefinition = "TEXT")
  private String benefits;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "job_family_id")
  private JobFamily jobFamily;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "career_level_id")
  private CareerLevel careerLevel;

  /**
   * Danh sách luật thưởng điểm áp dụng cho Job này. Thay thế cấu trúc JSONB tự do cũ bằng quan hệ
   * có schema rõ ràng. HR có thể reuse các rule đã được định nghĩa sẵn.
   */
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "job_institutional_rules",
      joinColumns = @JoinColumn(name = "job_id"),
      inverseJoinColumns = @JoinColumn(name = "rule_id"))
  @Builder.Default
  private List<InstitutionalRule> institutionalRules = new ArrayList<>();

  @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<JobCompetency> requiredCompetencies = new ArrayList<>();

  @Column(name = "is_active", nullable = false)
  @Builder.Default
  private Boolean isActive = true;

  @Column(name = "expired_at")
  private LocalDateTime expiredAt;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
