ALTER TABLE users
    ADD COLUMN employee_code VARCHAR(100),
    ADD COLUMN department_name VARCHAR(255),
    ADD COLUMN job_title VARCHAR(255),
    ADD COLUMN work_location VARCHAR(255),
    ADD COLUMN last_active_at TIMESTAMP,
    ADD COLUMN block_reason VARCHAR(240);

CREATE UNIQUE INDEX idx_users_employee_code
    ON users (employee_code)
    WHERE employee_code IS NOT NULL;
CREATE INDEX idx_users_role_active ON users (role, is_active);
CREATE INDEX idx_users_created_at ON users (created_at DESC);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    kind VARCHAR(80) NOT NULL,
    source VARCHAR(30) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    target_label VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_target ON activity_logs (target_type, target_id, created_at DESC);
CREATE INDEX idx_activity_logs_source ON activity_logs (source, created_at DESC);

INSERT INTO users (
    id, email, password_hash, full_name, role, is_active,
    employee_code, department_name, job_title, work_location
)
VALUES (
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
    'admin@tttn.com',
    '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa',
    'System Admin',
    'ADMIN',
    TRUE,
    'ADM-001',
    'Technology',
    'System Administrator',
    'Ho Chi Minh'
)
ON CONFLICT (email) DO NOTHING;
