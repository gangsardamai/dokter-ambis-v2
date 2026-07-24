-- =========================================================
-- DOKTER AMBIS
-- Migration 0065
-- File    : 0065_auto_lesson_order.sql
-- Purpose : Create lessons with a concurrency-safe automatic
--           order for each course.
-- Depends : 0055_course_explorer_v2.sql
-- =========================================================

CREATE OR REPLACE FUNCTION public.create_lesson_with_next_order(
  target_course_id UUID,
  target_folder_id UUID,
  lesson_title TEXT,
  lesson_slug TEXT,
  lesson_description TEXT,
  lesson_duration INTEGER,
  lesson_is_free BOOLEAN,
  lesson_is_required BOOLEAN,
  lesson_publication_status TEXT
)
RETURNS public.lessons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_lesson_order INTEGER;
  created_lesson public.lessons%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Silakan masuk terlebih dahulu.'
      USING ERRCODE = '42501';
  END IF;

  -- Lock the course row so simultaneous creates for the same course
  -- are serialized before MAX(lesson_order) is calculated.
  PERFORM 1
  FROM public.courses
  WHERE id = target_course_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT private.can_manage_course(target_course_id) THEN
    RAISE EXCEPTION 'Anda tidak memiliki izin mengelola Course ini.'
      USING ERRCODE = '42501';
  END IF;

  IF target_folder_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.lesson_folders
    WHERE id = target_folder_id
      AND course_id = target_course_id
  ) THEN
    RAISE EXCEPTION 'Folder tidak ditemukan pada Course ini.'
      USING ERRCODE = '22023';
  END IF;

  IF BTRIM(COALESCE(lesson_title, '')) = '' THEN
    RAISE EXCEPTION 'Judul Lesson wajib diisi.'
      USING ERRCODE = '22023';
  END IF;

  IF BTRIM(COALESCE(lesson_slug, '')) = '' THEN
    RAISE EXCEPTION 'Slug wajib diisi.'
      USING ERRCODE = '22023';
  END IF;

  IF COALESCE(lesson_duration, 0) <= 0 THEN
    RAISE EXCEPTION 'Durasi Lesson harus lebih dari 0 menit.'
      USING ERRCODE = '22023';
  END IF;

  IF lesson_publication_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Status publikasi Lesson tidak valid.'
      USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(MAX(lesson_order), 0) + 1
  INTO next_lesson_order
  FROM public.lessons
  WHERE course_id = target_course_id;

  INSERT INTO public.lessons (
    course_id,
    folder_id,
    title,
    slug,
    description,
    lesson_order,
    duration,
    is_free,
    is_required,
    publication_status
  )
  VALUES (
    target_course_id,
    target_folder_id,
    BTRIM(lesson_title),
    BTRIM(lesson_slug),
    NULLIF(BTRIM(COALESCE(lesson_description, '')), ''),
    next_lesson_order,
    lesson_duration,
    COALESCE(lesson_is_free, FALSE),
    COALESCE(lesson_is_required, TRUE),
    lesson_publication_status
  )
  RETURNING * INTO created_lesson;

  RETURN created_lesson;
END;
$$;

REVOKE ALL ON FUNCTION public.create_lesson_with_next_order(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  BOOLEAN,
  BOOLEAN,
  TEXT
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.create_lesson_with_next_order(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  BOOLEAN,
  BOOLEAN,
  TEXT
) FROM anon;

REVOKE ALL ON FUNCTION public.create_lesson_with_next_order(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  BOOLEAN,
  BOOLEAN,
  TEXT
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.create_lesson_with_next_order(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  BOOLEAN,
  BOOLEAN,
  TEXT
) TO authenticated;

COMMENT ON FUNCTION public.create_lesson_with_next_order(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  BOOLEAN,
  BOOLEAN,
  TEXT
) IS 'Creates a lesson using the next course-wide lesson_order under a course-row lock.';
