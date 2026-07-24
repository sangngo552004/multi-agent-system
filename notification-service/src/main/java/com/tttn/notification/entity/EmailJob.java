package com.tttn.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "email_jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailJob {

    @Id
    private String id; // Maps to outbox_event_id

    @Column(name = "batch_job_id", nullable = false)
    private String batchJobId;

    @Column(name = "application_id", nullable = false)
    private String applicationId;

    @Column(nullable = false)
    private String recipient;

    @Column(nullable = false)
    private String action; // INVITE or REJECT

    @Column(nullable = false)
    private String status; // SUCCESS or FAILED

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
