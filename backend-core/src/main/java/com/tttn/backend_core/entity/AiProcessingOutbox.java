package com.tttn.backend_core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "ai_processing_outbox")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProcessingOutbox {

  @Id private UUID id;

  @Column(name = "run_id", nullable = false, unique = true)
  private UUID runId;

  @Column(name = "application_id", nullable = false)
  private UUID applicationId;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "json")
  private Map<String, Object> payload;

  @Column(nullable = false, length = 20)
  @Builder.Default
  private String status = "NEW";

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "published_at")
  private LocalDateTime publishedAt;
}
