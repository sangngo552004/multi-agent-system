-- V18: Dữ liệu mẫu (Knowledge Base, Users, Jobs)

-- 1. Users
-- Hash: password123 ($2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa)
INSERT INTO users (id, email, password_hash, full_name, role, is_active, employee_code, department_name, job_title) VALUES
('u0000000-0000-0000-0000-0000000000a1', 'hr.tech@tttn.com', '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa', 'HR Tech Manager', 'HR', true, 'HR-T01', 'Technology', 'IT Recruiter'),
('u0000000-0000-0000-0000-0000000000a2', 'hr.sales@tttn.com', '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa', 'HR Sales Manager', 'HR', true, 'HR-S01', 'Sales', 'Sales Recruiter'),
('u0000000-0000-0000-0000-0000000000c1', 'candidate1@tttn.com', '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa', 'John Developer', 'CANDIDATE', true, NULL, NULL, NULL),
('u0000000-0000-0000-0000-0000000000c2', 'candidate2@tttn.com', '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa', 'Alice Data', 'CANDIDATE', true, NULL, NULL, NULL),
('u0000000-0000-0000-0000-0000000000c3', 'candidate3@tttn.com', '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa', 'Bob Sales', 'CANDIDATE', true, NULL, NULL, NULL)
ON CONFLICT (email) DO NOTHING;

-- 2. Institutional Rules (Luật thưởng điểm)
INSERT INTO institutional_rules (id, rule_code, name, description, bonus_points, max_impact_percent, applies_to_domain) VALUES
('r0000000-0000-0000-0000-000000000001', 'TOP_UNI', 'Sinh viên trường Top', 'Ưu tiên ứng viên xuất thân từ ĐH Top 1, Top 2.', 15.00, 10.00, 'ENGINEERING'),
('r0000000-0000-0000-0000-000000000002', 'BIG_TECH', 'Kinh nghiệm Big Tech', 'Từng làm việc tại các công ty công nghệ lớn.', 20.00, 15.00, 'ALL'),
('r0000000-0000-0000-0000-000000000003', 'ENG_FLUENT', 'Tiếng Anh xuất sắc', 'IELTS 7.0+ hoặc từng du học.', 10.00, 5.00, 'ALL')
ON CONFLICT (rule_code) DO NOTHING;

-- 3. Pedigree Entities (Trường ĐH / Công ty xếp hạng)
INSERT INTO pedigree_entities (name, type, rank, domain, country) VALUES
('Hanoi University of Science and Technology', 'UNIVERSITY', 'TIER_1', 'ENGINEERING', 'VN'),
('VNU University of Engineering and Technology', 'UNIVERSITY', 'TIER_1', 'ENGINEERING', 'VN'),
('FPT University', 'UNIVERSITY', 'TIER_2', 'ENGINEERING', 'VN'),
('Google', 'COMPANY', 'INTERNATIONAL', 'ALL', 'US'),
('VNG Corporation', 'COMPANY', 'TIER_1', 'ENGINEERING', 'VN');

-- 4. Competency Levels (Ngữ nghĩa)
INSERT INTO competency_levels (competency_id, level, label, description) VALUES
('c0000000-0000-0000-0000-000000000001', 1, 'Novice', 'Biết cú pháp cơ bản'),
('c0000000-0000-0000-0000-000000000001', 2, 'Beginner', 'Code được CRUD với Spring Boot'),
('c0000000-0000-0000-0000-000000000001', 3, 'Intermediate', 'Thành thạo JPA, Security, Caching'),
('c0000000-0000-0000-0000-000000000001', 4, 'Advanced', 'Tối ưu hiệu năng, Microservices'),
('c0000000-0000-0000-0000-000000000001', 5, 'Expert', 'Thiết kế kiến trúc hệ thống lớn')
ON CONFLICT (competency_id, level) DO NOTHING;

-- 5. Jobs (Không nạp Application để User tự Test luồng nộp CV)
INSERT INTO jobs (id, hr_id, job_family_id, career_level_id, title, location, employment_type, description, requirements, benefits, is_active, expired_at) VALUES
('j0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'eeee0000-0000-0000-0000-000000000000', 'Senior Java Developer', 'Ho Chi Minh', 'FULL_TIME', 'Build highly scalable core banking systems.', '5+ years Java', 'Premium Healthcare', true, '2026-12-31 23:59:59'),
('j0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'cccc0000-0000-0000-0000-000000000000', 'Junior Python Data Engineer', 'Ha Noi', 'FULL_TIME', 'Build data pipelines.', '1+ years Python', 'Free Lunch', true, '2026-12-31 23:59:59'),
('j0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-0000000000a2', '22222222-2222-2222-2222-222222222222', 'dddd0000-0000-0000-0000-000000000000', 'B2B Sales Specialist', 'Da Nang', 'FULL_TIME', 'Close B2B deals.', '3+ years Sales', 'High Commission', true, '2026-12-31 23:59:59');

-- 6. Job Competencies (Gắn luật tính điểm cho Job)
INSERT INTO job_competencies (job_id, competency_id, weight, required_level, is_mandatory) VALUES
('j0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 0.6, 4, true), -- Java (Advanced - Mandatory)
('j0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 0.3, 3, false), -- System Design
('j0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 0.1, 3, false); -- Communication

-- 7. Job Rules (Gắn luật thưởng điểm cho Job)
INSERT INTO job_institutional_rules (job_id, rule_id) VALUES
('j0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001'), -- Ưu tiên Top Uni
('j0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002'); -- Ưu tiên Big Tech
