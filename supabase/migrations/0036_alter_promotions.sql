-- =========================================================
-- DOKTER AMBIS
-- Migration 0036
-- File : 0036_alter_promotions.sql
-- Purpose : Extend Promotions Table
-- =========================================================

ALTER TABLE promotions

ADD COLUMN IF NOT EXISTS course_id UUID,

ADD COLUMN IF NOT EXISTS special_price NUMERIC(12,2),

ADD COLUMN IF NOT EXISTS max_discount NUMERIC(12,2),

ADD COLUMN IF NOT EXISTS minimum_purchase NUMERIC(12,2)
DEFAULT 0,

ADD COLUMN IF NOT EXISTS used_count INTEGER
NOT NULL DEFAULT 0,

ADD COLUMN IF NOT EXISTS usage_per_user INTEGER
NOT NULL DEFAULT 1,

ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE promotions

ADD CONSTRAINT fk_promotions_course
FOREIGN KEY(course_id)
REFERENCES courses(id)
ON DELETE SET NULL;

ALTER TABLE promotions

ADD CONSTRAINT fk_promotions_updated_by
FOREIGN KEY(updated_by)
REFERENCES profiles(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_promotions_course
ON promotions(course_id);

CREATE INDEX IF NOT EXISTS idx_promotions_updated_by
ON promotions(updated_by);