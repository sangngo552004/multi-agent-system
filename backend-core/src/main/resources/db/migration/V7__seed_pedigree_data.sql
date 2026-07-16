-- ============================================================
-- V7: Seed data cho pedigree_entities và institutional_rules
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PEDIGREE ENTITIES — Trường Đại học
-- ─────────────────────────────────────────────────────────────
INSERT INTO pedigree_entities (name, type, rank, domain, country) VALUES
    -- INTERNATIONAL
    ('RMIT University',                 'UNIVERSITY', 'INTERNATIONAL', 'ALL', 'AU'),
    ('National University of Singapore','UNIVERSITY', 'INTERNATIONAL', 'ALL', 'SG'),
    ('MIT',                             'UNIVERSITY', 'INTERNATIONAL', 'ALL', 'US'),

    -- TIER_1 (Top Việt Nam)
    ('Đại học Bách Khoa Hà Nội',       'UNIVERSITY', 'TIER_1', 'ALL', 'VN'),
    ('Đại học Bách Khoa TP.HCM',       'UNIVERSITY', 'TIER_1', 'ALL', 'VN'),
    ('Đại học Khoa học Tự nhiên',      'UNIVERSITY', 'TIER_1', 'ALL', 'VN'),
    ('Đại học Công nghệ Thông tin',    'UNIVERSITY', 'TIER_1', 'ENGINEERING', 'VN'),
    ('Đại học FPT',                    'UNIVERSITY', 'TIER_1', 'ENGINEERING', 'VN'),
    ('Đại học Ngoại Thương',           'UNIVERSITY', 'TIER_1', 'ALL', 'VN'),
    ('Đại học Kinh tế Quốc dân',       'UNIVERSITY', 'TIER_1', 'ALL', 'VN'),

    -- TIER_2
    ('Đại học Tôn Đức Thắng',          'UNIVERSITY', 'TIER_2', 'ALL', 'VN'),
    ('Đại học Quốc gia Hà Nội',        'UNIVERSITY', 'TIER_2', 'ALL', 'VN'),
    ('Đại học Quốc gia TP.HCM',        'UNIVERSITY', 'TIER_2', 'ALL', 'VN'),
    ('Đại học Huế',                    'UNIVERSITY', 'TIER_2', 'ALL', 'VN'),
    ('Đại học Đà Nẵng',                'UNIVERSITY', 'TIER_2', 'ALL', 'VN')

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- PEDIGREE ENTITIES — Công ty Tech (ENGINEERING domain)
-- ─────────────────────────────────────────────────────────────
INSERT INTO pedigree_entities (name, type, rank, domain, country) VALUES
    -- TIER_1 Tech
    ('VNG Corporation',    'COMPANY', 'TIER_1', 'ENGINEERING', 'VN'),
    ('Shopee',             'COMPANY', 'TIER_1', 'ENGINEERING', 'SG'),
    ('Grab',               'COMPANY', 'TIER_1', 'ENGINEERING', 'SG'),
    ('MoMo',               'COMPANY', 'TIER_1', 'ENGINEERING', 'VN'),
    ('FPT Software',       'COMPANY', 'TIER_1', 'ENGINEERING', 'VN'),
    ('Viettel',            'COMPANY', 'TIER_1', 'ENGINEERING', 'VN'),
    ('Gojek',              'COMPANY', 'TIER_1', 'ENGINEERING', 'ID'),
    ('Cốc Cốc',            'COMPANY', 'TIER_1', 'ENGINEERING', 'VN'),
    ('KMS Technology',     'COMPANY', 'TIER_1', 'ENGINEERING', 'VN'),

    -- TIER_2 Tech
    ('VNPAY',              'COMPANY', 'TIER_2', 'ENGINEERING', 'VN'),
    ('VNPT',               'COMPANY', 'TIER_2', 'ENGINEERING', 'VN'),
    ('Tiki',               'COMPANY', 'TIER_2', 'ENGINEERING', 'VN'),
    ('Sendo',              'COMPANY', 'TIER_2', 'ENGINEERING', 'VN'),
    ('Techcombank',        'COMPANY', 'TIER_2', 'ENGINEERING', 'VN'),
    ('TPBank',             'COMPANY', 'TIER_2', 'ENGINEERING', 'VN')

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- PEDIGREE ENTITIES — Agency (SALES_MARKETING domain)
-- ─────────────────────────────────────────────────────────────
INSERT INTO pedigree_entities (name, type, rank, domain, country) VALUES
    -- TIER_1 Agency
    ('Ogilvy',      'AGENCY', 'TIER_1', 'SALES_MARKETING', 'UK'),
    ('Dentsu',      'AGENCY', 'TIER_1', 'SALES_MARKETING', 'JP'),
    ('GroupM',      'AGENCY', 'TIER_1', 'SALES_MARKETING', 'UK'),
    ('Omnicom',     'AGENCY', 'TIER_1', 'SALES_MARKETING', 'US'),
    ('Publicis',    'AGENCY', 'TIER_1', 'SALES_MARKETING', 'FR'),

    -- TIER_2 Agency (Vietnam local)
    ('Novaon',      'AGENCY', 'TIER_2', 'SALES_MARKETING', 'VN'),
    ('Cheil',       'AGENCY', 'TIER_2', 'SALES_MARKETING', 'KR'),
    ('Wunderman',   'AGENCY', 'TIER_2', 'SALES_MARKETING', 'US')

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- INSTITUTIONAL RULES — Seed bộ rule chuẩn
-- bonus_points: điểm thô
-- max_impact_percent: tối đa % overall bị ảnh hưởng
-- Ví dụ: INTERNATIONAL_SCHOOL_BONUS → bonus_points=20, max_impact=15
--   → actual impact = 20 * (15/100) = 3.0 điểm vào overall (nếu overall=70 → 73)
-- ─────────────────────────────────────────────────────────────
INSERT INTO institutional_rules (rule_code, name, description, bonus_points, max_impact_percent, applies_to_domain) VALUES
    (
        'INTERNATIONAL_SCHOOL_BONUS',
        'Tốt nghiệp trường Quốc tế',
        'Cộng điểm cho ứng viên tốt nghiệp trường đại học được xếp hạng INTERNATIONAL (RMIT, NUS, MIT...).',
        20.00, 15.00, 'ALL'
    ),
    (
        'TIER_1_SCHOOL_BONUS',
        'Tốt nghiệp trường Top 1 Việt Nam',
        'Cộng điểm cho ứng viên tốt nghiệp các trường đại học TIER_1 trong nước (Bách Khoa, Ngoại Thương...).',
        15.00, 12.00, 'ALL'
    ),
    (
        'TIER_2_SCHOOL_BONUS',
        'Tốt nghiệp trường Top 2 Việt Nam',
        'Cộng điểm cho ứng viên tốt nghiệp các trường đại học TIER_2 (ĐH Quốc gia, Tôn Đức Thắng...).',
        8.00, 8.00, 'ALL'
    ),
    (
        'TIER_1_COMPANY_BONUS',
        'Kinh nghiệm tại công ty TIER_1',
        'Cộng điểm cho ứng viên có kinh nghiệm làm việc tại công ty TIER_1 phù hợp domain công việc.',
        15.00, 12.00, 'ALL'
    ),
    (
        'TIER_2_COMPANY_BONUS',
        'Kinh nghiệm tại công ty TIER_2',
        'Cộng điểm cho ứng viên có kinh nghiệm làm việc tại công ty TIER_2 phù hợp domain công việc.',
        8.00, 8.00, 'ALL'
    )

ON CONFLICT (rule_code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- COMPETENCY LEVELS — Seed ngữ nghĩa cho các competency phổ biến
-- ─────────────────────────────────────────────────────────────
INSERT INTO competency_levels (competency_id, level, label, description) VALUES
    -- Java/Spring Boot (c0000000-0000-0000-0000-000000000001)
    ('c0000000-0000-0000-0000-000000000001', 1, 'Cơ bản',    'Hiểu cú pháp Java cơ bản, có thể viết chương trình đơn giản.'),
    ('c0000000-0000-0000-0000-000000000001', 2, 'Sơ cấp',    'Biết Spring Boot cơ bản, có thể tạo REST API CRUD đơn giản.'),
    ('c0000000-0000-0000-0000-000000000001', 3, 'Thành thạo','Xây dựng được backend hoàn chỉnh, hiểu IoC/DI, JPA, security cơ bản.'),
    ('c0000000-0000-0000-0000-000000000001', 4, 'Nâng cao',  'Thiết kế microservices, xử lý concurrency, tối ưu performance.'),
    ('c0000000-0000-0000-0000-000000000001', 5, 'Chuyên gia','Lead được team, review architecture, contribute open-source.'),

    -- Python (c0000000-0000-0000-0000-000000000002)
    ('c0000000-0000-0000-0000-000000000002', 1, 'Cơ bản',    'Biết Python cơ bản, viết script đơn giản.'),
    ('c0000000-0000-0000-0000-000000000002', 2, 'Sơ cấp',    'Dùng được các thư viện phổ biến (pandas, requests), viết script automation.'),
    ('c0000000-0000-0000-0000-000000000002', 3, 'Thành thạo','Xây dựng được API với FastAPI/Django, xử lý data pipeline.'),
    ('c0000000-0000-0000-0000-000000000002', 4, 'Nâng cao',  'Machine Learning pipeline, async programming, packaging library.'),
    ('c0000000-0000-0000-0000-000000000002', 5, 'Chuyên gia','Architect hệ thống AI/Data, contribute framework lớn.')

ON CONFLICT (competency_id, level) DO NOTHING;
