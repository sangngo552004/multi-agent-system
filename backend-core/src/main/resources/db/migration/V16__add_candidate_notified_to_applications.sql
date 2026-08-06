ALTER TABLE applications
ADD COLUMN is_candidate_notified BOOLEAN NOT NULL DEFAULT FALSE;
