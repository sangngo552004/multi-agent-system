-- V15 introduced job_status for the Java entity but accidentally retained the
-- legacy NOT NULL status column. Hibernate only writes job_status, so new jobs
-- fail to insert because the unused status column receives NULL.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'jobs'
          AND column_name = 'status'
    ) THEN
        -- Preserve statuses of rows that predate job_status. Do not overwrite a
        -- newer job_status value (for example DRAFT -> PUBLISHED after V15).
        UPDATE jobs
        SET job_status = status
        WHERE job_status = 'DRAFT'
          AND status IN ('PUBLISHED', 'PAUSED', 'CLOSED');

        ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_status;
        DROP INDEX IF EXISTS idx_jobs_status_created_at;
        ALTER TABLE jobs DROP COLUMN status;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_job_status_created_at
    ON jobs (job_status, created_at DESC);
