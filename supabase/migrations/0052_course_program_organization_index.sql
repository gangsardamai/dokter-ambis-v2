-- =========================================================
-- DOKTER AMBIS
-- Migration 0052
-- File : 0052_course_program_organization_index.sql
-- Purpose : Cover the composite Course–Program–Organization foreign key
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_courses_program_organization
ON public.courses(program_id, organization_id);
