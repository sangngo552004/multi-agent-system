CREATE TABLE batch_jobs (
    id VARCHAR(36) PRIMARY KEY,
    total_count INT NOT NULL,
    last_processed_index INT DEFAULT 0,
    processed_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: We use JSONB in PostgreSQL instead of JSON for better indexing/performance.
-- Postgres does not have ON UPDATE CURRENT_TIMESTAMP natively in DDL, so we rely on JPA @UpdateTimestamp.

CREATE INDEX idx_batch_jobs_status_created ON batch_jobs (status, created_at);


CREATE TABLE outbox_events (
    id VARCHAR(36) PRIMARY KEY,
    batch_job_id VARCHAR(36) NOT NULL,
    application_id VARCHAR(36) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE outbox_events ADD CONSTRAINT uk_batch_app UNIQUE (batch_job_id, application_id);
CREATE INDEX idx_outbox_events_status_created ON outbox_events (status, created_at);
