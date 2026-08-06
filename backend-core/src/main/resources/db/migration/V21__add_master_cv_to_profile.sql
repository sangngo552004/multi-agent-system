ALTER TABLE candidate_profiles
ADD COLUMN cv_url VARCHAR(255),
ADD COLUMN raw_cv_data JSON;
