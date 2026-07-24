package com.tttn.backend_core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
    name = "outbox_events",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_batch_app",
          columnNames = {"batch_job_id", "application_id"})
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxEvent {

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "batch_job_id", length = 36, nullable = false)
  private String batchJobId;

  @Column(name = "application_id", length = 36, nullable = false)
  private String applicationId;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> payload;

  @Column(length = 20)
  @Builder.Default
  private String status = "NEW"; // 'NEW', 'PUBLISHED'

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
