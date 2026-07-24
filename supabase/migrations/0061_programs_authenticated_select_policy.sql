-- =========================================================
-- DOKTER AMBIS
-- Migration 0061
-- File    : 0061_programs_authenticated_select_policy.sql
-- Purpose : Allow authenticated reads required by admin CRUD
--           while exposing inactive programs only to active admins.
-- Depends : 0060_course_materials_image_mime_types.sql
-- =========================================================

DROP POLICY IF EXISTS "Authenticated users can select programs"
ON public.programs;

DROP POLICY IF EXISTS programs_authenticated_select
ON public.programs;

CREATE POLICY programs_authenticated_select
ON public.programs
FOR SELECT
TO authenticated
USING (
  status = 'active'::public.program_status
  OR (SELECT private.is_active_admin())
);
