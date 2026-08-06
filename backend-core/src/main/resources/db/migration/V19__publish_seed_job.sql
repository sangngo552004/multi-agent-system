-- V19: Update seed job status to PUBLISHED for public view

UPDATE jobs
SET status = 'PUBLISHED', job_status = 'PUBLISHED'
WHERE id = 'd0000000-0000-0000-0000-000000000001';
