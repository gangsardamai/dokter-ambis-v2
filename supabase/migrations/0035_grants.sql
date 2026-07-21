-- =========================================================
-- DOKTER AMBIS
-- Migration 0035
-- File : 0035_grants.sql
-- Purpose : PostgreSQL Privileges
-- =========================================================

GRANT USAGE
ON SCHEMA public
TO authenticated;

-- =========================================================
-- MASTER DATA
-- =========================================================

GRANT SELECT
ON organizations
TO authenticated;

GRANT SELECT
ON programs
TO authenticated;

GRANT SELECT
ON courses
TO authenticated;

GRANT SELECT
ON mentor_details
TO authenticated;

GRANT SELECT
ON course_mentors
TO authenticated;

GRANT SELECT
ON lessons
TO authenticated;

GRANT SELECT
ON videos
TO authenticated;

GRANT SELECT
ON lesson_files
TO authenticated;

GRANT SELECT
ON live_classes
TO authenticated;

GRANT SELECT
ON quizzes
TO authenticated;

GRANT SELECT
ON quiz_questions
TO authenticated;

GRANT SELECT
ON quiz_options
TO authenticated;

GRANT SELECT
ON course_announcements
TO authenticated;

-- =========================================================
-- USER DATA
-- =========================================================

GRANT
SELECT,
UPDATE
ON profiles
TO authenticated;

GRANT
SELECT,
INSERT,
UPDATE
ON enrollments
TO authenticated;

GRANT
SELECT,
INSERT,
UPDATE
ON payments
TO authenticated;

GRANT
SELECT,
INSERT,
UPDATE
ON lesson_progress
TO authenticated;

GRANT
SELECT,
INSERT,
UPDATE
ON quiz_attempts
TO authenticated;

GRANT
SELECT,
INSERT,
UPDATE
ON quiz_answers
TO authenticated;

GRANT
SELECT,
INSERT,
UPDATE
ON device_sessions
TO authenticated;

GRANT
SELECT
ON activity_logs
TO authenticated;   