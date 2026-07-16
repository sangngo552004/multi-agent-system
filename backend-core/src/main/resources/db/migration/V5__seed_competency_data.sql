-- Seed Job Families
INSERT INTO job_families (id, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'ENGINEERING', 'Phòng Công nghệ / Kỹ thuật phần mềm'),
    ('22222222-2222-2222-2222-222222222222', 'SALES', 'Phòng Kinh doanh'),
    ('33333333-3333-3333-3333-333333333333', 'MARKETING', 'Phòng Truyền thông / Marketing'),
    ('44444444-4444-4444-4444-444444444444', 'CUSTOMER_SUPPORT', 'Phòng Chăm sóc khách hàng')
ON CONFLICT (name) DO NOTHING;

-- Seed Career Levels
INSERT INTO career_levels (id, name, rank_value) VALUES
    ('aaaa0000-0000-0000-0000-000000000000', 'INTERN', 1),
    ('bbbb0000-0000-0000-0000-000000000000', 'FRESHER', 2),
    ('cccc0000-0000-0000-0000-000000000000', 'JUNIOR', 3),
    ('dddd0000-0000-0000-0000-000000000000', 'MID', 4),
    ('eeee0000-0000-0000-0000-000000000000', 'SENIOR', 5),
    ('ffff0000-0000-0000-0000-000000000000', 'LEAD', 6),
    ('00001111-1111-1111-1111-111111111111', 'MANAGER', 7),
    ('00002222-2222-2222-2222-222222222222', 'DIRECTOR', 8)
ON CONFLICT (name) DO NOTHING;

-- Seed Basic Competencies
INSERT INTO competencies (id, name, category, description) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Java/Spring Boot', 'HARD_SKILL', 'Thành thạo lập trình Java và framework Spring Boot'),
    ('c0000000-0000-0000-0000-000000000002', 'Python', 'HARD_SKILL', 'Lập trình Python và các thư viện liên quan'),
    ('c0000000-0000-0000-0000-000000000003', 'System Design', 'HARD_SKILL', 'Thiết kế hệ thống chịu tải cao, microservices'),
    ('c0000000-0000-0000-0000-000000000004', 'Communication', 'SOFT_SKILL', 'Kỹ năng giao tiếp và làm việc nhóm'),
    ('c0000000-0000-0000-0000-000000000005', 'Leadership', 'SOFT_SKILL', 'Kỹ năng lãnh đạo, quản lý con người'),
    ('c0000000-0000-0000-0000-000000000006', 'B2B Sales', 'HARD_SKILL', 'Kinh nghiệm chốt sale khách hàng doanh nghiệp'),
    ('c0000000-0000-0000-0000-000000000007', 'SEO/SEM', 'HARD_SKILL', 'Tối ưu hóa công cụ tìm kiếm và chạy quảng cáo')
ON CONFLICT (name) DO NOTHING;
