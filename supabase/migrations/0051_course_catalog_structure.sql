-- =========================================================
-- DOKTER AMBIS
-- Migration 0051
-- File : 0051_course_catalog_structure.sql
-- Purpose : Organization-owned programs and per-organization course slugs
-- =========================================================

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS is_general BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO public.organizations (
    slug,
    title,
    short_name,
    status,
    is_general
)
VALUES (
    'umum',
    'Umum / Nasional',
    'UMUM',
    'active',
    TRUE
)
ON CONFLICT (slug)
DO UPDATE SET
    title = EXCLUDED.title,
    short_name = EXCLUDED.short_name,
    status = EXCLUDED.status,
    is_general = TRUE,
    updated_at = NOW();

ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE public.programs AS p
SET organization_id = o.id
FROM public.organizations AS o
WHERE p.slug = 'belajar-sesuai-blok'
  AND o.slug = 'unair'
  AND p.organization_id IS NULL;

UPDATE public.programs AS p
SET organization_id = o.id
FROM public.organizations AS o
WHERE p.slug = 'ukmppd'
  AND o.slug = 'umum'
  AND p.organization_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.programs
        WHERE organization_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot set programs.organization_id NOT NULL: programs without organization remain';
    END IF;
END;
$$;

ALTER TABLE public.programs
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.programs
DROP CONSTRAINT IF EXISTS fk_programs_organization;

ALTER TABLE public.programs
ADD CONSTRAINT fk_programs_organization
FOREIGN KEY (organization_id)
REFERENCES public.organizations(id)
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_programs_organization
ON public.programs(organization_id);

ALTER TABLE public.programs
DROP CONSTRAINT IF EXISTS uq_programs_id_organization;

ALTER TABLE public.programs
ADD CONSTRAINT uq_programs_id_organization
UNIQUE (id, organization_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.courses
        GROUP BY organization_id, lower(slug)
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot normalize course slugs: duplicate organization_id and lower(slug) combinations exist';
    END IF;
END;
$$;

UPDATE public.courses AS c
SET slug = lower(c.slug)
WHERE c.slug <> lower(c.slug);

ALTER TABLE public.courses
DROP CONSTRAINT IF EXISTS uq_courses_slug;

DROP INDEX IF EXISTS public.uq_courses_organization_lower_slug;

CREATE UNIQUE INDEX uq_courses_organization_lower_slug
ON public.courses(organization_id, lower(slug));

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.courses AS c
        JOIN public.programs AS p
          ON p.id = c.program_id
        WHERE p.organization_id <> c.organization_id
    ) THEN
        RAISE EXCEPTION 'Cannot add course/program organization constraint: mismatched courses exist';
    END IF;
END;
$$;

ALTER TABLE public.courses
DROP CONSTRAINT IF EXISTS fk_courses_program_organization;

ALTER TABLE public.courses
ADD CONSTRAINT fk_courses_program_organization
FOREIGN KEY (program_id, organization_id)
REFERENCES public.programs(id, organization_id)
ON DELETE RESTRICT;
