-- =========================================================
-- DOKTER AMBIS
-- Migration 0057
-- Purpose: Allow anonymous users to read the public catalog
--          while keeping inactive Organizations, Programs,
--          and Courses hidden through RLS.
-- =========================================================

GRANT SELECT
ON TABLE public.organizations,
         public.programs,
         public.courses
TO anon;

DROP POLICY IF EXISTS organizations_public_read
ON public.organizations;

CREATE POLICY organizations_public_read
ON public.organizations
FOR SELECT
TO anon
USING (
  status = 'active'
);

DROP POLICY IF EXISTS programs_public_read
ON public.programs;

CREATE POLICY programs_public_read
ON public.programs
FOR SELECT
TO anon
USING (
  status = 'active'
);

DROP POLICY IF EXISTS courses_public_read
ON public.courses;

CREATE POLICY courses_public_read
ON public.courses
FOR SELECT
TO anon
USING (
  status = 'active'
);

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.organizations,
         public.programs,
         public.courses
FROM anon;
