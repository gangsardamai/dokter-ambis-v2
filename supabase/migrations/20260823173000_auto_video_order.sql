-- =========================================================
-- DOKTER AMBIS
-- Purpose : Assign video_order automatically for each lesson
-- =========================================================

CREATE OR REPLACE FUNCTION private.set_next_video_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Serialize simultaneous video inserts for the same lesson.
  PERFORM 1
  FROM public.lessons
  WHERE id = NEW.lesson_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Materi tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(MAX(video_order), 0) + 1
  INTO NEW.video_order
  FROM public.videos
  WHERE lesson_id = NEW.lesson_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.set_next_video_order() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.set_next_video_order() FROM anon;
REVOKE ALL ON FUNCTION private.set_next_video_order() FROM authenticated;

DROP TRIGGER IF EXISTS trg_set_next_video_order
ON public.videos;

CREATE TRIGGER trg_set_next_video_order
BEFORE INSERT
ON public.videos
FOR EACH ROW
EXECUTE FUNCTION private.set_next_video_order();

COMMENT ON FUNCTION private.set_next_video_order()
IS 'Assigns the next lesson-scoped video_order under a lesson-row lock.';
