-- Seed the reusable organization groups required by institutional rules.
-- V24 created the schema but left the catalog empty, so GET /pedigree-groups returned [].
INSERT INTO pedigree_groups (code, name, evidence_source)
VALUES
    ('INTERNATIONAL_UNIVERSITIES', 'Trường đại học quốc tế', 'EDUCATION'),
    ('TIER_1_UNIVERSITIES', 'Trường đại học Tier 1', 'EDUCATION'),
    ('TIER_2_UNIVERSITIES', 'Trường đại học Tier 2', 'EDUCATION'),
    ('TIER_1_COMPANIES', 'Công ty Tier 1', 'EXPERIENCE'),
    ('TIER_2_COMPANIES', 'Công ty Tier 2', 'EXPERIENCE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO pedigree_group_members (group_id, pedigree_entity_id)
SELECT group_item.id, organization.id
FROM pedigree_groups group_item
JOIN pedigree_entities organization ON (
    (group_item.code = 'INTERNATIONAL_UNIVERSITIES' AND organization.type = 'UNIVERSITY' AND organization.rank = 'INTERNATIONAL') OR
    (group_item.code = 'TIER_1_UNIVERSITIES' AND organization.type = 'UNIVERSITY' AND organization.rank = 'TIER_1') OR
    (group_item.code = 'TIER_2_UNIVERSITIES' AND organization.type = 'UNIVERSITY' AND organization.rank = 'TIER_2') OR
    (group_item.code = 'TIER_1_COMPANIES' AND organization.type = 'COMPANY' AND organization.rank = 'TIER_1') OR
    (group_item.code = 'TIER_2_COMPANIES' AND organization.type = 'COMPANY' AND organization.rank = 'TIER_2')
)
ON CONFLICT (group_id, pedigree_entity_id) DO NOTHING;

UPDATE institutional_rules rule
SET pedigree_group_id = group_item.id
FROM pedigree_groups group_item
WHERE rule.pedigree_group_id IS NULL
  AND (
    (rule.rule_code = 'INTERNATIONAL_SCHOOL_BONUS' AND group_item.code = 'INTERNATIONAL_UNIVERSITIES') OR
    (rule.rule_code IN ('TIER_1_SCHOOL_BONUS', 'TOP_UNI') AND group_item.code = 'TIER_1_UNIVERSITIES') OR
    (rule.rule_code = 'TIER_2_SCHOOL_BONUS' AND group_item.code = 'TIER_2_UNIVERSITIES') OR
    (rule.rule_code IN ('TIER_1_COMPANY_BONUS', 'BIG_TECH') AND group_item.code = 'TIER_1_COMPANIES') OR
    (rule.rule_code = 'TIER_2_COMPANY_BONUS' AND group_item.code = 'TIER_2_COMPANIES')
  );
