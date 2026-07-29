ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_status;

UPDATE jobs
SET status = 'PUBLISHED'
WHERE status = 'OPEN';

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_status
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED'));
