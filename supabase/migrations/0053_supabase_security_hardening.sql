-- =========================================================
-- DOKTER AMBIS
-- Migration 0053
-- File    : 0053_supabase_security_hardening.sql
-- Purpose : Restrict master-data writes to active admins,
--           enable RLS for promotions, and hide privileged
--           helper functions from the exposed public schema.
-- =========================================================

-- Private helpers can still be used by RLS policies without becoming
-- PostgREST RPC endpoints, because the private schema is not exposed.
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION private.has_active_course_access(
  target_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE profile_id = (SELECT auth.uid())
      AND course_id = target_course_id
      AND status = 'active'
      AND (
        expired_at IS NULL
        OR expired_at > NOW()
      )
  );
$$;

REVOKE ALL ON FUNCTION private.is_active_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_active_admin() FROM anon;
REVOKE ALL ON FUNCTION private.has_active_course_access(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_active_course_access(UUID) FROM anon;

GRANT EXECUTE ON FUNCTION private.is_active_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_active_course_access(UUID) TO authenticated;

-- Trigger helpers must not inherit a caller-controlled search_path.
ALTER FUNCTION public.update_updated_at_column()
SET search_path = pg_catalog;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    university_origin,
    role,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      'Mahasiswa'
    ),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
      CONCAT('TEMP-', SUBSTRING(NEW.id::TEXT, 1, 8))
    ),
    NULLIF(
      TRIM(NEW.raw_user_meta_data->>'university_origin'),
      ''
    ),
    'student',
    'active'
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- =========================================================
-- POLICIES THAT USE PRIVILEGED HELPERS
-- =========================================================

DROP POLICY IF EXISTS "Admins read profiles and users read own profile"
ON public.profiles;

CREATE POLICY "Admins read profiles and users read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_active_admin())
  OR id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins and students read enrollments"
ON public.enrollments;

CREATE POLICY "Admins and students read enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_active_admin())
  OR profile_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Active admins update enrollments"
ON public.enrollments;

CREATE POLICY "Active admins update enrollments"
ON public.enrollments
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

DROP POLICY IF EXISTS "Admins and students read payments"
ON public.payments;

CREATE POLICY "Admins and students read payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_active_admin())
  OR EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE enrollments.id = payments.enrollment_id
      AND enrollments.profile_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Active admins update payments"
ON public.payments;

CREATE POLICY "Active admins update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

DROP POLICY IF EXISTS "Students read lessons from active courses"
ON public.lessons;

CREATE POLICY "Students read lessons from active courses"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  private.has_active_course_access(course_id)
  OR (SELECT private.is_active_admin())
);

DROP POLICY IF EXISTS "Students read folders from active courses"
ON public.lesson_folders;

CREATE POLICY "Students read folders from active courses"
ON public.lesson_folders
FOR SELECT
TO authenticated
USING (
  private.has_active_course_access(course_id)
  OR (SELECT private.is_active_admin())
);

DROP POLICY IF EXISTS "Admin can read videos"
ON public.videos;
DROP POLICY IF EXISTS "Admin can insert videos"
ON public.videos;
DROP POLICY IF EXISTS "Admin can update videos"
ON public.videos;
DROP POLICY IF EXISTS "Admin can delete videos"
ON public.videos;

CREATE POLICY "Admin can read videos"
ON public.videos
FOR SELECT
TO authenticated
USING ((SELECT private.is_active_admin()));

CREATE POLICY "Admin can insert videos"
ON public.videos
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY "Admin can update videos"
ON public.videos
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY "Admin can delete videos"
ON public.videos
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

-- =========================================================
-- ADMIN-ONLY MASTER-DATA WRITES
-- =========================================================

DROP POLICY IF EXISTS "Authenticated users can insert organizations"
ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations"
ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can delete organizations"
ON public.organizations;

CREATE POLICY "Active admins can insert organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY "Active admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY "Active admins can delete organizations"
ON public.organizations
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

DROP POLICY IF EXISTS programs_authenticated_insert
ON public.programs;
DROP POLICY IF EXISTS programs_authenticated_update
ON public.programs;
DROP POLICY IF EXISTS programs_authenticated_delete
ON public.programs;

CREATE POLICY programs_admin_insert
ON public.programs
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY programs_admin_update
ON public.programs
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY programs_admin_delete
ON public.programs
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

DROP POLICY IF EXISTS "Authenticated users can insert courses"
ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can update courses"
ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can delete courses"
ON public.courses;

CREATE POLICY "Active admins can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY "Active admins can update courses"
ON public.courses
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY "Active admins can delete courses"
ON public.courses
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

DROP POLICY IF EXISTS "Authenticated users can insert lessons"
ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can update lessons"
ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can delete lessons"
ON public.lessons;

CREATE POLICY "Active admins can insert lessons"
ON public.lessons
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY "Active admins can update lessons"
ON public.lessons
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY "Active admins can delete lessons"
ON public.lessons
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

-- Remove all overlapping temporary folder write policies before adding
-- one unambiguous set of admin-only policies.
DROP POLICY IF EXISTS lesson_folders_authenticated_all
ON public.lesson_folders;
DROP POLICY IF EXISTS lesson_folders_insert
ON public.lesson_folders;
DROP POLICY IF EXISTS lesson_folders_update
ON public.lesson_folders;
DROP POLICY IF EXISTS lesson_folders_delete
ON public.lesson_folders;

CREATE POLICY lesson_folders_admin_insert
ON public.lesson_folders
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY lesson_folders_admin_update
ON public.lesson_folders
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY lesson_folders_admin_delete
ON public.lesson_folders
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

-- =========================================================
-- PROMOTIONS
-- =========================================================

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotions_admin_select
ON public.promotions;
DROP POLICY IF EXISTS promotions_admin_insert
ON public.promotions;
DROP POLICY IF EXISTS promotions_admin_update
ON public.promotions;
DROP POLICY IF EXISTS promotions_admin_delete
ON public.promotions;

CREATE POLICY promotions_admin_select
ON public.promotions
FOR SELECT
TO authenticated
USING ((SELECT private.is_active_admin()));

CREATE POLICY promotions_admin_insert
ON public.promotions
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY promotions_admin_update
ON public.promotions
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY promotions_admin_delete
ON public.promotions
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

-- The public-schema helpers are no longer needed after every dependent
-- policy has been repointed to the non-exposed private schema.
DROP FUNCTION IF EXISTS public.has_active_course_access(UUID);
DROP FUNCTION IF EXISTS public.is_active_admin();
