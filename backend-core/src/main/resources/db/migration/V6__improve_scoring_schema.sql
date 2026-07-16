-- ============================================================
-- V6: Cải thiện schema hệ thống Scoring
-- 1. Thêm is_mandatory vào job_competencies
-- 2. Tạo bảng competency_levels (định nghĩa ngữ nghĩa level 1-5)
-- 3. Tạo bảng pedigree_entities (thay thế knowledge_base.py hardcode)
-- 4. Tạo bảng institutional_rules (normalize khỏi JSONB tự do)
-- 5. Tạo bảng job_institutional_rules (join table)
-- 6. Thêm scoring_breakdown vào applications
-- 7. Drop cột institutional_rules JSONB khỏi jobs (sau khi migrate data)
-- ============================================================

-- 1. Thêm is_mandatory vào job_competencies
ALTER TABLE job_competencies
    ADD COLUMN is_mandatory BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN job_competencies.is_mandatory IS
    'Nếu TRUE, ứng viên thiếu competency này sẽ bị loại ngay (Knockout rule)';

-- 2. Bảng định nghĩa ngữ nghĩa level 1-5 cho từng competency
CREATE TABLE competency_levels (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    level        INT  NOT NULL CHECK (level BETWEEN 1 AND 5),
    label        VARCHAR(100) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (competency_id, level)
);

COMMENT ON TABLE competency_levels IS
    'Định nghĩa ngữ nghĩa từng bậc (1-5) cho một Competency. '
    'Ví dụ: Java level=3 → "Thành thạo: có thể xây dựng REST API độc lập".';

-- 3. Bảng pedigree_entities — thay thế hardcode trong knowledge_base.py
--    Hỗ trợ 4 bậc xếp hạng thay vì binary TIER_1 vs OTHER
CREATE TABLE pedigree_entities (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    type       VARCHAR(50)  NOT NULL CHECK (type IN ('UNIVERSITY', 'COMPANY', 'AGENCY')),
    rank       VARCHAR(50)  NOT NULL CHECK (rank IN ('INTERNATIONAL', 'TIER_1', 'TIER_2', 'TIER_3')),
    domain     VARCHAR(100) NOT NULL DEFAULT 'ALL',
    country    VARCHAR(10)  NOT NULL DEFAULT 'VN',
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pedigree_entities IS
    'Danh sách tổ chức (trường ĐH, công ty) được xếp hạng, '
    'dùng để tính bonus điểm trong Institutional Rules. '
    'Thay thế danh sách hardcode trong knowledge_base.py của AI Service.';

COMMENT ON COLUMN pedigree_entities.rank IS
    'INTERNATIONAL=1.0, TIER_1=0.8, TIER_2=0.5, TIER_3=0.2 (hệ số bonus tương ứng)';

COMMENT ON COLUMN pedigree_entities.domain IS
    'Domain áp dụng: ENGINEERING, SALES_MARKETING, FINANCE, ALL. '
    '"ALL" nghĩa là áp dụng với mọi job_family.';

CREATE INDEX idx_pedigree_type_rank ON pedigree_entities(type, rank, is_active);

-- 4. Bảng institutional_rules — normalize rule ra khỏi JSONB tự do
CREATE TABLE institutional_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code           VARCHAR(100) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    bonus_points        NUMERIC(5,2) NOT NULL DEFAULT 0.00
                            CHECK (bonus_points >= 0 AND bonus_points <= 100),
    max_impact_percent  NUMERIC(5,2) NOT NULL DEFAULT 20.00
                            CHECK (max_impact_percent >= 0 AND max_impact_percent <= 100),
    applies_to_domain   VARCHAR(100) NOT NULL DEFAULT 'ALL',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP
);

COMMENT ON TABLE institutional_rules IS
    'Luật thưởng điểm có thể reuse giữa nhiều Job. '
    'Tác động thực tế vào overall_score = bonus_points * (max_impact_percent / 100). '
    'HR nhìn vào max_impact_percent để hiểu rõ trọng lượng thực tế.';

COMMENT ON COLUMN institutional_rules.bonus_points IS
    'Điểm bonus thô (0-100). Nhân với max_impact_percent/100 ra điểm thực cộng vào overall.';

COMMENT ON COLUMN institutional_rules.max_impact_percent IS
    'Tối đa bao nhiêu % overall_score mà bonus này có thể ảnh hưởng. '
    'Ví dụ: bonus_points=15, max_impact_percent=20 → tối đa +3 điểm vào overall.';

-- 5. Join table: Job ↔ InstitutionalRule
CREATE TABLE job_institutional_rules (
    job_id  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES institutional_rules(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, rule_id)
);

-- 6. Thêm scoring_breakdown vào applications (audit trail)
ALTER TABLE applications
    ADD COLUMN scoring_breakdown JSONB;

COMMENT ON COLUMN applications.scoring_breakdown IS
    'Audit trail điểm: breakdown từng competency và rule đã trigger. '
    'Cấu trúc: {competency_scores: [...], rules_triggered: [...], rejection_reason: "..."}';

-- 7. Drop cột institutional_rules JSONB cũ khỏi jobs
--    (data cũ đã được chuyển sang bảng institutional_rules + job_institutional_rules)
ALTER TABLE jobs DROP COLUMN IF EXISTS institutional_rules;
