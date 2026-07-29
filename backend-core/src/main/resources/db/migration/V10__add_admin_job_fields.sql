ALTER TABLE jobs
    ADD COLUMN status VARCHAR(30),
    ADD COLUMN department_name VARCHAR(255),
    ADD COLUMN openings_count INTEGER NOT NULL DEFAULT 1;

UPDATE jobs
SET status = CASE WHEN is_active THEN 'OPEN' ELSE 'CLOSED' END,
    department_name = COALESCE(
        (SELECT u.department_name FROM users u WHERE u.id = jobs.hr_id),
        'Chưa cập nhật'
    );

ALTER TABLE jobs ALTER COLUMN status SET NOT NULL;
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_status
    CHECK (status IN ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED'));
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_openings_count
    CHECK (openings_count > 0);

CREATE INDEX idx_jobs_status_created_at ON jobs (status, created_at DESC);
CREATE INDEX idx_jobs_family_level ON jobs (job_family_id, career_level_id);
