-- Replace legacy institutional-rule demo data.
-- Those records predate pedigree_groups and therefore have no reliable matching target.
-- Only known seed codes are removed; HR-created rules are left untouched.

DELETE FROM rule_job_families
WHERE rule_id IN (
    SELECT id FROM institutional_rules
    WHERE rule_code IN (
        'TOP_UNI', 'BIG_TECH', 'ENG_FLUENT',
        'INTERNATIONAL_SCHOOL_BONUS', 'TIER_1_SCHOOL_BONUS', 'TIER_2_SCHOOL_BONUS',
        'TIER_1_COMPANY_BONUS', 'TIER_2_COMPANY_BONUS'
    )
);

DELETE FROM job_institutional_rules
WHERE rule_id IN (
    SELECT id FROM institutional_rules
    WHERE rule_code IN (
        'TOP_UNI', 'BIG_TECH', 'ENG_FLUENT',
        'INTERNATIONAL_SCHOOL_BONUS', 'TIER_1_SCHOOL_BONUS', 'TIER_2_SCHOOL_BONUS',
        'TIER_1_COMPANY_BONUS', 'TIER_2_COMPANY_BONUS'
    )
);

DELETE FROM institutional_rules
WHERE rule_code IN (
    'TOP_UNI', 'BIG_TECH', 'ENG_FLUENT',
    'INTERNATIONAL_SCHOOL_BONUS', 'TIER_1_SCHOOL_BONUS', 'TIER_2_SCHOOL_BONUS',
    'TIER_1_COMPANY_BONUS', 'TIER_2_COMPANY_BONUS'
);

-- A rule is always inserted through a selected group. Group members are the only eligible
-- organizations for its matching evidence source.
INSERT INTO institutional_rules (
    rule_code, name, description, pedigree_group_id,
    bonus_points, max_impact_percent, applies_to_domain, is_active
)
SELECT seed.rule_code, seed.name, seed.description, group_item.id,
       seed.bonus_points, seed.max_impact_percent, seed.applies_to_domain, TRUE
FROM (
    VALUES
        ('EDU_INTERNATIONAL_BONUS', 'Ưu tiên học vấn quốc tế',
         'Áp dụng khi CV có bằng cấp từ một tổ chức trong nhóm Trường đại học quốc tế.',
         'INTERNATIONAL_UNIVERSITIES', 12.00::NUMERIC, 10.00::NUMERIC, 'ALL'),
        ('EDU_TIER_1_BONUS', 'Ưu tiên học vấn Tier 1',
         'Áp dụng khi CV có bằng cấp từ một tổ chức trong nhóm Trường đại học Tier 1.',
         'TIER_1_UNIVERSITIES', 8.00::NUMERIC, 8.00::NUMERIC, 'ALL'),
        ('EDU_TIER_2_BONUS', 'Ưu tiên học vấn Tier 2',
         'Áp dụng khi CV có bằng cấp từ một tổ chức trong nhóm Trường đại học Tier 2.',
         'TIER_2_UNIVERSITIES', 4.00::NUMERIC, 5.00::NUMERIC, 'ALL'),
        ('EXP_TIER_1_BONUS', 'Ưu tiên kinh nghiệm Tier 1',
         'Áp dụng khi lịch sử làm việc có một tổ chức trong nhóm Công ty Tier 1.',
         'TIER_1_COMPANIES', 10.00::NUMERIC, 10.00::NUMERIC, 'ALL'),
        ('EXP_TIER_2_BONUS', 'Ưu tiên kinh nghiệm Tier 2',
         'Áp dụng khi lịch sử làm việc có một tổ chức trong nhóm Công ty Tier 2.',
         'TIER_2_COMPANIES', 5.00::NUMERIC, 6.00::NUMERIC, 'ALL')
) AS seed(rule_code, name, description, group_code, bonus_points, max_impact_percent, applies_to_domain)
JOIN pedigree_groups group_item ON group_item.code = seed.group_code
ON CONFLICT (rule_code) DO NOTHING;

-- Keep the seeded Senior Java job usable as a demo after removing its legacy rules.
INSERT INTO job_institutional_rules (job_id, rule_id)
SELECT 'd0000000-0000-0000-0000-000000000001'::UUID, rule.id
FROM institutional_rules rule
WHERE rule.rule_code IN ('EDU_TIER_1_BONUS', 'EXP_TIER_1_BONUS')
ON CONFLICT (job_id, rule_id) DO NOTHING;
