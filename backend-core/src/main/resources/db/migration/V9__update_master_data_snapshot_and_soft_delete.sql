-- ============================================================
-- V9: Cập nhật Schema cho Giai đoạn 5 (Master Data Snapshot & Soft Delete)
-- 1. Đổi tên cột 'status' thành 'job_status' trong bảng jobs
-- 2. Bổ sung trường snapshot_data (TEXT) để lưu JSON vào jobs
-- 3. Bổ sung trường is_active cho các bảng Master Data
-- ============================================================

-- 1. Đổi tên cột status thành job_status (cho chuẩn với Java entity)
ALTER TABLE jobs ADD COLUMN job_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT';

-- 2. Thêm cột snapshot_data lưu trữ JSON snapshot
ALTER TABLE jobs ADD COLUMN snapshot_data TEXT;

-- 3. Thêm is_active cho các bảng Master Data (ngoại trừ institutional_rules đã có sẵn từ V6)
ALTER TABLE competencies ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE career_levels ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE job_families ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
