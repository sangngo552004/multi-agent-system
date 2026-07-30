package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "actor_id")
  private User actor;

  @Column(name = "actor_name", nullable = false)
  private String actorName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 80)
  private ActivityKind kind;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private ActivitySource source;

  @Enumerated(EnumType.STRING)
  @Column(name = "target_type", nullable = false, length = 30)
  private ActivityTargetType targetType;

  @Column(name = "target_id", nullable = false)
  private UUID targetId;

  @Column(name = "target_label", nullable = false)
  private String targetLabel;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String description;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "json")
  private Map<String, Object> metadata;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
