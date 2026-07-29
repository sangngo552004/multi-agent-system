ALTER TABLE job_families
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE career_levels
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE competencies
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE competencies
    ALTER COLUMN category TYPE VARCHAR(180);

UPDATE job_families
SET name = regexp_replace(trim(name), '\s+', ' ', 'g');

UPDATE career_levels
SET name = regexp_replace(trim(name), '\s+', ' ', 'g');

UPDATE competencies
SET name = regexp_replace(trim(name), '\s+', ' ', 'g');

CREATE UNIQUE INDEX IF NOT EXISTS uk_job_families_normalized_name
    ON job_families (lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS uk_career_levels_normalized_name
    ON career_levels (lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS uk_competencies_normalized_name
    ON competencies (lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS uk_career_levels_rank_value
    ON career_levels (rank_value);

CREATE INDEX IF NOT EXISTS idx_job_families_active_name
    ON job_families (is_active, name);

CREATE INDEX IF NOT EXISTS idx_career_levels_active_rank
    ON career_levels (is_active, rank_value);

CREATE INDEX IF NOT EXISTS idx_competencies_active_name
    ON competencies (is_active, name);
