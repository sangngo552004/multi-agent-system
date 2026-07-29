ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS ai_status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    ADD COLUMN IF NOT EXISTS ai_confidence DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS ai_error_code VARCHAR(80),
    ADD COLUMN IF NOT EXISTS ai_error_message TEXT,
    ADD COLUMN IF NOT EXISTS ai_warning_count INT NOT NULL DEFAULT 0;

UPDATE applications
SET ai_status = 'COMPLETED'
WHERE fit_score IS NOT NULL
  AND ai_status = 'WAITING';

CREATE TABLE ai_processing_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    attempt INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    trigger VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_code VARCHAR(80),
    error_message TEXT,
    CONSTRAINT uk_ai_run_attempt UNIQUE (application_id, attempt),
    CONSTRAINT uk_ai_run_idempotency UNIQUE (application_id, idempotency_key)
);

CREATE UNIQUE INDEX uk_ai_run_active_application
    ON ai_processing_runs (application_id)
    WHERE status IN ('WAITING', 'PROCESSING');

CREATE INDEX idx_ai_runs_application_attempt
    ON ai_processing_runs (application_id, attempt DESC);

CREATE INDEX idx_ai_runs_status_accepted
    ON ai_processing_runs (status, accepted_at DESC);

CREATE TABLE ai_processing_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES ai_processing_runs(id) ON DELETE CASCADE,
    step_name VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message VARCHAR(500) NOT NULL,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    CONSTRAINT uk_ai_step_run_name UNIQUE (run_id, step_name)
);

CREATE INDEX idx_ai_steps_run
    ON ai_processing_steps (run_id, step_name);

CREATE TABLE ai_processing_outbox (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL UNIQUE REFERENCES ai_processing_runs(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX idx_ai_outbox_status_created
    ON ai_processing_outbox (status, created_at);

CREATE TABLE ai_processed_events (
    event_id VARCHAR(120) PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES ai_processing_runs(id) ON DELETE CASCADE,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_ai_status_applied
    ON applications (ai_status, applied_at DESC);

CREATE INDEX idx_applications_applied_at
    ON applications (applied_at DESC);
