-- =========================================================
-- DOKTER AMBIS
-- Migration 0056
-- File    : 0056_course_explorer_dml_grants.sql
-- Purpose : Restore authenticated DML privileges for
--           manager-controlled Course Explorer content.
-- Depends : 0055_course_explorer_v2.sql
-- =========================================================

-- RLS remains the authorization boundary. These grants only
-- expose the DML operations to authenticated users; the
-- existing policies still restrict writes to active admins
-- and mentors assigned to the related course.

GRANT INSERT, UPDATE, DELETE
ON TABLE public.lesson_files
TO authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.quizzes
TO authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.quiz_questions
TO authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.quiz_options
TO authenticated;

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.lesson_files
FROM anon;

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.quizzes
FROM anon;

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.quiz_questions
FROM anon;

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.quiz_options
FROM anon;
