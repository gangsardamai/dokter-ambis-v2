-- =========================================================
-- DOKTER AMBIS
-- Migration 0025
-- File : 0025_triggers.sql
-- Purpose : Automatically update updated_at column
-- =========================================================

-- =========================================================
-- Profiles
-- =========================================================

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Organizations
-- =========================================================

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Programs
-- =========================================================

CREATE TRIGGER trg_programs_updated_at
BEFORE UPDATE ON programs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Courses
-- =========================================================

CREATE TRIGGER trg_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Mentor Details
-- =========================================================

CREATE TRIGGER trg_mentor_details_updated_at
BEFORE UPDATE ON mentor_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Lessons
-- =========================================================

CREATE TRIGGER trg_lessons_updated_at
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Videos
-- =========================================================

CREATE TRIGGER trg_videos_updated_at
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Lesson Files
-- =========================================================

CREATE TRIGGER trg_lesson_files_updated_at
BEFORE UPDATE ON lesson_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Live Classes
-- =========================================================

CREATE TRIGGER trg_live_classes_updated_at
BEFORE UPDATE ON live_classes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Quizzes
-- =========================================================

CREATE TRIGGER trg_quizzes_updated_at
BEFORE UPDATE ON quizzes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Quiz Questions
-- =========================================================

CREATE TRIGGER trg_quiz_questions_updated_at
BEFORE UPDATE ON quiz_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Quiz Options
-- =========================================================

CREATE TRIGGER trg_quiz_options_updated_at
BEFORE UPDATE ON quiz_options
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Quiz Attempts
-- =========================================================

CREATE TRIGGER trg_quiz_attempts_updated_at
BEFORE UPDATE ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Quiz Answers
-- =========================================================

CREATE TRIGGER trg_quiz_answers_updated_at
BEFORE UPDATE ON quiz_answers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Enrollments
-- =========================================================

CREATE TRIGGER trg_enrollments_updated_at
BEFORE UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Payments
-- =========================================================

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Device Sessions
-- =========================================================

CREATE TRIGGER trg_device_sessions_updated_at
BEFORE UPDATE ON device_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Lesson Progress
-- =========================================================

CREATE TRIGGER trg_lesson_progress_updated_at
BEFORE UPDATE ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Course Announcements
-- =========================================================

CREATE TRIGGER trg_course_announcements_updated_at
BEFORE UPDATE ON course_announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();