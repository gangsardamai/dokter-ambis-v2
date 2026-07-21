-- =========================================================
-- DOKTER AMBIS
-- Migration 0033
-- File : 0033_course_pricing.sql
-- Purpose : Course Pricing
-- =========================================================

ALTER TABLE courses

ADD COLUMN price NUMERIC(12,0)
    NOT NULL
    DEFAULT 0,

ADD COLUMN is_free BOOLEAN
    NOT NULL
    DEFAULT FALSE;

ALTER TABLE courses

ADD CONSTRAINT chk_courses_price
CHECK (price >= 0);

CREATE INDEX idx_courses_price
ON courses(price);

CREATE INDEX idx_courses_is_free
ON courses(is_free);