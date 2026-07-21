-- =========================================================
-- DOKTER AMBIS
-- Migration 0034
-- File : 0034_enrollment_promotions.sql
-- Purpose : Promotion Snapshot for Enrollments
-- =========================================================

ALTER TABLE enrollments

ADD COLUMN promotion_id UUID,

ADD COLUMN promotion_code_snapshot VARCHAR(50),

ADD COLUMN promotion_name_snapshot VARCHAR(150),

ADD COLUMN discount_amount NUMERIC(12,0)
    NOT NULL
    DEFAULT 0;

ALTER TABLE enrollments

ADD CONSTRAINT fk_enrollments_promotion
FOREIGN KEY (promotion_id)
REFERENCES promotions(id)
ON DELETE SET NULL;

ALTER TABLE enrollments

ADD CONSTRAINT chk_enrollments_discount_amount
CHECK (discount_amount >= 0);

CREATE INDEX idx_enrollments_promotion
ON enrollments(promotion_id);