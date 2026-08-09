CREATE TABLE pedigree_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    evidence_source VARCHAR(40) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pedigree_group_members (
    group_id UUID NOT NULL REFERENCES pedigree_groups(id) ON DELETE CASCADE,
    pedigree_entity_id UUID NOT NULL REFERENCES pedigree_entities(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, pedigree_entity_id)
);

CREATE TABLE pedigree_entity_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedigree_entity_id UUID NOT NULL REFERENCES pedigree_entities(id) ON DELETE CASCADE,
    alias VARCHAR(255) NOT NULL,
    normalized_alias VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO pedigree_entity_aliases (pedigree_entity_id, alias, normalized_alias)
SELECT id, name, lower(name)
FROM pedigree_entities
ON CONFLICT (normalized_alias) DO NOTHING;

ALTER TABLE institutional_rules ADD COLUMN IF NOT EXISTS pedigree_group_id UUID REFERENCES pedigree_groups(id);

CREATE TABLE IF NOT EXISTS rule_job_families (
    rule_id UUID NOT NULL REFERENCES institutional_rules(id) ON DELETE CASCADE,
    job_family_id UUID NOT NULL REFERENCES job_families(id) ON DELETE CASCADE,
    PRIMARY KEY (rule_id, job_family_id)
);
