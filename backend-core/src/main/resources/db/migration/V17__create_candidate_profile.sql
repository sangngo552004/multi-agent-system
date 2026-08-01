CREATE TABLE candidate_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skills JSON,
    experience JSON,
    education JSON
);
