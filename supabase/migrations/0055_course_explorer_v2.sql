-- =========================================================
-- DOKTER AMBIS
-- Migration 0055
-- File    : 0055_course_explorer_v2.sql
-- Purpose : Secure, ordered Course Explorer content with
--           assigned-mentor management and multi-quiz support.
-- Depends : 0053_supabase_security_hardening.sql
--           0054_enrollment_payment_material_access_hardening.sql
-- =========================================================

-- =========================================================
-- CONTENT STRUCTURE
-- =========================================================

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.lessons
DROP CONSTRAINT IF EXISTS chk_lessons_publication_status;

ALTER TABLE public.lessons
ADD CONSTRAINT chk_lessons_publication_status
CHECK (publication_status IN ('draft', 'published'));

ALTER TABLE public.lesson_folders
ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft';

ALTER TABLE public.lesson_folders
DROP CONSTRAINT IF EXISTS chk_lesson_folders_publication_status;

ALTER TABLE public.lesson_folders
ADD CONSTRAINT chk_lesson_folders_publication_status
CHECK (publication_status IN ('draft', 'published'));

ALTER TABLE public.lesson_files
ADD COLUMN IF NOT EXISTS file_order INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.lesson_files
DROP CONSTRAINT IF EXISTS chk_lesson_files_order;
ALTER TABLE public.lesson_files
DROP CONSTRAINT IF EXISTS chk_lesson_files_publication_status;

ALTER TABLE public.lesson_files
ADD CONSTRAINT chk_lesson_files_order
CHECK (file_order > 0);

ALTER TABLE public.lesson_files
ADD CONSTRAINT chk_lesson_files_publication_status
CHECK (publication_status IN ('draft', 'published'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_lesson_files_lesson_order
ON public.lesson_files(lesson_id, file_order);

ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS video_order INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.videos
DROP CONSTRAINT IF EXISTS chk_videos_order;
ALTER TABLE public.videos
DROP CONSTRAINT IF EXISTS chk_videos_publication_status;

ALTER TABLE public.videos
ADD CONSTRAINT chk_videos_order
CHECK (video_order > 0);

ALTER TABLE public.videos
ADD CONSTRAINT chk_videos_publication_status
CHECK (publication_status IN ('draft', 'published'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_videos_lesson_order
ON public.videos(lesson_id, video_order);

-- A lesson may contain multiple quizzes.
ALTER TABLE public.quizzes
DROP CONSTRAINT IF EXISTS uq_quizzes_lesson;

ALTER TABLE public.quizzes
ALTER COLUMN total_questions SET DEFAULT 0;

ALTER TABLE public.quizzes
DROP CONSTRAINT IF EXISTS chk_quizzes_total_questions;

ALTER TABLE public.quizzes
ADD CONSTRAINT chk_quizzes_total_questions
CHECK (total_questions >= 0);

ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS quiz_order INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.quizzes
DROP CONSTRAINT IF EXISTS chk_quizzes_order;
ALTER TABLE public.quizzes
DROP CONSTRAINT IF EXISTS chk_quizzes_publication_status;

ALTER TABLE public.quizzes
ADD CONSTRAINT chk_quizzes_order
CHECK (quiz_order > 0);

ALTER TABLE public.quizzes
ADD CONSTRAINT chk_quizzes_publication_status
CHECK (publication_status IN ('draft', 'published'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_quizzes_lesson_order
ON public.quizzes(lesson_id, quiz_order);

CREATE INDEX IF NOT EXISTS idx_course_mentors_mentor
ON public.course_mentors(mentor_id, course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_files_lesson_status
ON public.lesson_files(lesson_id, publication_status, file_order);

CREATE INDEX IF NOT EXISTS idx_videos_lesson_status
ON public.videos(lesson_id, publication_status, video_order);

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_status
ON public.quizzes(lesson_id, publication_status, quiz_order);

-- Keep total_questions synchronized with the actual question rows.
CREATE OR REPLACE FUNCTION private.sync_quiz_total_questions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_quiz_id UUID;
BEGIN
  target_quiz_id := COALESCE(NEW.quiz_id, OLD.quiz_id);

  UPDATE public.quizzes
  SET
    total_questions = GREATEST(
      (
        SELECT COUNT(*)::INTEGER
        FROM public.quiz_questions
        WHERE quiz_id = target_quiz_id
      ),
      0
    ),
    updated_at = NOW()
  WHERE id = target_quiz_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION private.sync_quiz_total_questions() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_quiz_total_questions() FROM anon;
REVOKE ALL ON FUNCTION private.sync_quiz_total_questions() FROM authenticated;

DROP TRIGGER IF EXISTS trg_sync_quiz_total_questions
ON public.quiz_questions;

CREATE TRIGGER trg_sync_quiz_total_questions
AFTER INSERT OR DELETE OR UPDATE OF quiz_id
ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION private.sync_quiz_total_questions();

-- =========================================================
-- QUIZ RESULT SUMMARY
-- =========================================================

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  attempts_used INTEGER NOT NULL DEFAULT 0,
  best_score NUMERIC(5,2),
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  first_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_quiz_results_profile
    FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_quiz_results_quiz
    FOREIGN KEY (quiz_id)
    REFERENCES public.quizzes(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_quiz_results_profile_quiz
    UNIQUE (profile_id, quiz_id),

  CONSTRAINT chk_quiz_results_attempts
    CHECK (attempts_used >= 0),

  CONSTRAINT chk_quiz_results_score
    CHECK (
      best_score IS NULL
      OR (best_score >= 0 AND best_score <= 100)
    )
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_profile
ON public.quiz_results(profile_id, quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz
ON public.quiz_results(quiz_id, best_score DESC);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- New tables are not automatically exposed by every Supabase project.
GRANT SELECT ON public.quiz_results TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_results FROM authenticated;
REVOKE ALL ON public.quiz_results FROM anon;

-- =========================================================
-- ROLE AND COURSE AUTHORIZATION
-- =========================================================

CREATE OR REPLACE FUNCTION private.is_assigned_course_mentor(
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
    FROM public.course_mentors AS cm
    JOIN public.mentor_details AS md
      ON md.id = cm.mentor_id
    JOIN public.profiles AS p
      ON p.id = md.profile_id
    WHERE cm.course_id = target_course_id
      AND md.profile_id = (SELECT auth.uid())
      AND p.role = 'mentor'
      AND p.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION private.can_manage_course(
  target_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    private.is_active_admin()
    OR private.is_assigned_course_mentor(target_course_id);
$$;

CREATE OR REPLACE FUNCTION private.can_access_course_content(
  target_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    private.can_manage_course(target_course_id)
    OR private.has_active_course_access(target_course_id);
$$;

CREATE OR REPLACE FUNCTION private.can_access_lesson(
  target_lesson_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lessons
    WHERE id = target_lesson_id
      AND private.can_access_course_content(course_id)
  );
$$;

CREATE OR REPLACE FUNCTION private.can_manage_lesson(
  target_lesson_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lessons
    WHERE id = target_lesson_id
      AND private.can_manage_course(course_id)
  );
$$;

CREATE OR REPLACE FUNCTION private.can_manage_quiz(
  target_quiz_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quizzes
    WHERE id = target_quiz_id
      AND private.can_manage_lesson(lesson_id)
  );
$$;

REVOKE ALL ON FUNCTION private.is_assigned_course_mentor(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_assigned_course_mentor(UUID) FROM anon;
REVOKE ALL ON FUNCTION private.can_manage_course(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_course(UUID) FROM anon;
REVOKE ALL ON FUNCTION private.can_access_course_content(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_access_course_content(UUID) FROM anon;
REVOKE ALL ON FUNCTION private.can_access_lesson(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_access_lesson(UUID) FROM anon;
REVOKE ALL ON FUNCTION private.can_manage_lesson(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_lesson(UUID) FROM anon;
REVOKE ALL ON FUNCTION private.can_manage_quiz(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_quiz(UUID) FROM anon;

GRANT EXECUTE ON FUNCTION private.is_assigned_course_mentor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_course(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_course_content(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_lesson(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_lesson(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_quiz(UUID) TO authenticated;

-- =========================================================
-- COURSE MENTOR POLICIES
-- =========================================================

DROP POLICY IF EXISTS course_mentors_public_read
ON public.course_mentors;
DROP POLICY IF EXISTS course_mentors_select
ON public.course_mentors;
DROP POLICY IF EXISTS course_mentors_admin_insert
ON public.course_mentors;
DROP POLICY IF EXISTS course_mentors_admin_update
ON public.course_mentors;
DROP POLICY IF EXISTS course_mentors_admin_delete
ON public.course_mentors;

CREATE POLICY course_mentors_authorized_select
ON public.course_mentors
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_active_admin())
  OR EXISTS (
    SELECT 1
    FROM public.mentor_details
    WHERE mentor_details.id = course_mentors.mentor_id
      AND mentor_details.profile_id = (SELECT auth.uid())
  )
);

CREATE POLICY course_mentors_admin_insert
ON public.course_mentors
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY course_mentors_admin_update
ON public.course_mentors
FOR UPDATE
TO authenticated
USING ((SELECT private.is_active_admin()))
WITH CHECK ((SELECT private.is_active_admin()));

CREATE POLICY course_mentors_admin_delete
ON public.course_mentors
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

-- =========================================================
-- FOLDER AND LESSON POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Students read folders from active courses"
ON public.lesson_folders;
DROP POLICY IF EXISTS lesson_folders_admin_insert
ON public.lesson_folders;
DROP POLICY IF EXISTS lesson_folders_admin_update
ON public.lesson_folders;
DROP POLICY IF EXISTS lesson_folders_admin_delete
ON public.lesson_folders;

CREATE POLICY lesson_folders_authorized_select
ON public.lesson_folders
FOR SELECT
TO authenticated
USING (
  private.can_manage_course(course_id)
  OR (
    publication_status = 'published'
    AND private.has_active_course_access(course_id)
  )
);

CREATE POLICY lesson_folders_manager_insert
ON public.lesson_folders
FOR INSERT
TO authenticated
WITH CHECK (private.can_manage_course(course_id));

CREATE POLICY lesson_folders_manager_update
ON public.lesson_folders
FOR UPDATE
TO authenticated
USING (private.can_manage_course(course_id))
WITH CHECK (private.can_manage_course(course_id));

CREATE POLICY lesson_folders_manager_delete
ON public.lesson_folders
FOR DELETE
TO authenticated
USING (private.can_manage_course(course_id));

DROP POLICY IF EXISTS "Students read lessons from active courses"
ON public.lessons;
DROP POLICY IF EXISTS "Active admins can insert lessons"
ON public.lessons;
DROP POLICY IF EXISTS "Active admins can update lessons"
ON public.lessons;
DROP POLICY IF EXISTS "Active admins can delete lessons"
ON public.lessons;

CREATE POLICY lessons_authorized_select
ON public.lessons
FOR SELECT
TO authenticated
USING (
  private.can_manage_course(course_id)
  OR (
    publication_status = 'published'
    AND private.has_active_course_access(course_id)
  )
);

CREATE POLICY lessons_manager_insert
ON public.lessons
FOR INSERT
TO authenticated
WITH CHECK (private.can_manage_course(course_id));

CREATE POLICY lessons_manager_update
ON public.lessons
FOR UPDATE
TO authenticated
USING (private.can_manage_course(course_id))
WITH CHECK (private.can_manage_course(course_id));

CREATE POLICY lessons_manager_delete
ON public.lessons
FOR DELETE
TO authenticated
USING (private.can_manage_course(course_id));

-- =========================================================
-- FILE, VIDEO, AND QUIZ POLICIES
-- =========================================================

DROP POLICY IF EXISTS lesson_files_authorized_read
ON public.lesson_files;
DROP POLICY IF EXISTS lesson_files_manager_select
ON public.lesson_files;
DROP POLICY IF EXISTS lesson_files_manager_insert
ON public.lesson_files;
DROP POLICY IF EXISTS lesson_files_manager_update
ON public.lesson_files;
DROP POLICY IF EXISTS lesson_files_manager_delete
ON public.lesson_files;

CREATE POLICY lesson_files_authorized_select
ON public.lesson_files
FOR SELECT
TO authenticated
USING (
  private.can_manage_lesson(lesson_id)
  OR (
    publication_status = 'published'
    AND private.can_access_lesson(lesson_id)
  )
);

CREATE POLICY lesson_files_manager_insert
ON public.lesson_files
FOR INSERT
TO authenticated
WITH CHECK (private.can_manage_lesson(lesson_id));

CREATE POLICY lesson_files_manager_update
ON public.lesson_files
FOR UPDATE
TO authenticated
USING (private.can_manage_lesson(lesson_id))
WITH CHECK (private.can_manage_lesson(lesson_id));

CREATE POLICY lesson_files_manager_delete
ON public.lesson_files
FOR DELETE
TO authenticated
USING (private.can_manage_lesson(lesson_id));

DROP POLICY IF EXISTS "Admin can read videos"
ON public.videos;
DROP POLICY IF EXISTS "Admin can insert videos"
ON public.videos;
DROP POLICY IF EXISTS "Admin can update videos"
ON public.videos;
DROP POLICY IF EXISTS "Admin can delete videos"
ON public.videos;
DROP POLICY IF EXISTS videos_student_access
ON public.videos;

CREATE POLICY videos_authorized_select
ON public.videos
FOR SELECT
TO authenticated
USING (
  private.can_manage_lesson(lesson_id)
  OR (
    publication_status = 'published'
    AND private.can_access_lesson(lesson_id)
  )
);

CREATE POLICY videos_manager_insert
ON public.videos
FOR INSERT
TO authenticated
WITH CHECK (private.can_manage_lesson(lesson_id));

CREATE POLICY videos_manager_update
ON public.videos
FOR UPDATE
TO authenticated
USING (private.can_manage_lesson(lesson_id))
WITH CHECK (private.can_manage_lesson(lesson_id));

CREATE POLICY videos_manager_delete
ON public.videos
FOR DELETE
TO authenticated
USING (private.can_manage_lesson(lesson_id));

DROP POLICY IF EXISTS quizzes_authorized_read
ON public.quizzes;

CREATE POLICY quizzes_authorized_select
ON public.quizzes
FOR SELECT
TO authenticated
USING (
  private.can_manage_lesson(lesson_id)
  OR (
    publication_status = 'published'
    AND private.can_access_lesson(lesson_id)
  )
);

CREATE POLICY quizzes_manager_insert
ON public.quizzes
FOR INSERT
TO authenticated
WITH CHECK (private.can_manage_lesson(lesson_id));

CREATE POLICY quizzes_manager_update
ON public.quizzes
FOR UPDATE
TO authenticated
USING (private.can_manage_lesson(lesson_id))
WITH CHECK (private.can_manage_lesson(lesson_id));

CREATE POLICY quizzes_manager_delete
ON public.quizzes
FOR DELETE
TO authenticated
USING (private.can_manage_lesson(lesson_id));

-- Question explanations and correct options must never be readable through
-- direct student table queries. Only managers can read/write these tables.
DROP POLICY IF EXISTS quiz_questions_authorized_read
ON public.quiz_questions;
DROP POLICY IF EXISTS quiz_questions_manager_select
ON public.quiz_questions;
DROP POLICY IF EXISTS quiz_questions_manager_insert
ON public.quiz_questions;
DROP POLICY IF EXISTS quiz_questions_manager_update
ON public.quiz_questions;
DROP POLICY IF EXISTS quiz_questions_manager_delete
ON public.quiz_questions;

CREATE POLICY quiz_questions_manager_select
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (private.can_manage_quiz(quiz_id));

CREATE POLICY quiz_questions_manager_insert
ON public.quiz_questions
FOR INSERT
TO authenticated
WITH CHECK (private.can_manage_quiz(quiz_id));

CREATE POLICY quiz_questions_manager_update
ON public.quiz_questions
FOR UPDATE
TO authenticated
USING (private.can_manage_quiz(quiz_id))
WITH CHECK (private.can_manage_quiz(quiz_id));

CREATE POLICY quiz_questions_manager_delete
ON public.quiz_questions
FOR DELETE
TO authenticated
USING (private.can_manage_quiz(quiz_id));

DROP POLICY IF EXISTS quiz_options_authorized_read
ON public.quiz_options;
DROP POLICY IF EXISTS quiz_options_manager_select
ON public.quiz_options;
DROP POLICY IF EXISTS quiz_options_manager_insert
ON public.quiz_options;
DROP POLICY IF EXISTS quiz_options_manager_update
ON public.quiz_options;
DROP POLICY IF EXISTS quiz_options_manager_delete
ON public.quiz_options;

CREATE POLICY quiz_options_manager_select
ON public.quiz_options
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quiz_questions
    WHERE quiz_questions.id = quiz_options.question_id
      AND private.can_manage_quiz(quiz_questions.quiz_id)
  )
);

CREATE POLICY quiz_options_manager_insert
ON public.quiz_options
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.quiz_questions
    WHERE quiz_questions.id = quiz_options.question_id
      AND private.can_manage_quiz(quiz_questions.quiz_id)
  )
);

CREATE POLICY quiz_options_manager_update
ON public.quiz_options
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quiz_questions
    WHERE quiz_questions.id = quiz_options.question_id
      AND private.can_manage_quiz(quiz_questions.quiz_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.quiz_questions
    WHERE quiz_questions.id = quiz_options.question_id
      AND private.can_manage_quiz(quiz_questions.quiz_id)
  )
);

CREATE POLICY quiz_options_manager_delete
ON public.quiz_options
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quiz_questions
    WHERE quiz_questions.id = quiz_options.question_id
      AND private.can_manage_quiz(quiz_questions.quiz_id)
  )
);

-- Attempts and correctness are server-computed. Students may read their own
-- rows but cannot directly create or modify score-bearing records.
DROP POLICY IF EXISTS quiz_attempts_owner
ON public.quiz_attempts;
DROP POLICY IF EXISTS quiz_attempts_select
ON public.quiz_attempts;

CREATE POLICY quiz_attempts_authorized_select
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR private.can_manage_quiz(quiz_id)
);

DROP POLICY IF EXISTS quiz_answers_owner
ON public.quiz_answers;
DROP POLICY IF EXISTS quiz_answers_select
ON public.quiz_answers;

CREATE POLICY quiz_answers_authorized_select
ON public.quiz_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_answers.attempt_id
      AND private.can_manage_quiz(quiz_attempts.quiz_id)
  )
);

DROP POLICY IF EXISTS quiz_results_authorized_select
ON public.quiz_results;

CREATE POLICY quiz_results_authorized_select
ON public.quiz_results
FOR SELECT
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR private.can_manage_quiz(quiz_id)
);

GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT SELECT ON public.quiz_answers TO authenticated;
REVOKE INSERT, UPDATE, DELETE
ON public.quiz_attempts, public.quiz_answers
FROM authenticated;
REVOKE ALL
ON public.quiz_attempts, public.quiz_answers
FROM anon;

-- =========================================================
-- SAFE QUIZ RPC
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_quiz_for_attempt(
  target_quiz_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_profile_id UUID := (SELECT auth.uid());
  quiz_record public.quizzes%ROWTYPE;
  attempts_used INTEGER;
  question_payload JSONB;
BEGIN
  IF current_profile_id IS NULL THEN
    RAISE EXCEPTION 'Silakan masuk untuk membuka quiz.'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO quiz_record
  FROM public.quizzes
  WHERE id = target_quiz_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT private.can_manage_quiz(target_quiz_id) THEN
    IF quiz_record.publication_status <> 'published'
       OR NOT private.has_active_course_access(
         (
           SELECT lessons.course_id
           FROM public.lessons
           WHERE lessons.id = quiz_record.lesson_id
         )
       ) THEN
      RAISE EXCEPTION 'Anda tidak memiliki akses ke quiz ini.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO attempts_used
  FROM public.quiz_attempts
  WHERE profile_id = current_profile_id
    AND quiz_id = target_quiz_id
    AND submitted_at IS NOT NULL;

  SELECT COALESCE(
    jsonb_agg(question_item ORDER BY display_position),
    '[]'::JSONB
  )
  INTO question_payload
  FROM (
    SELECT
      CASE
        WHEN quiz_record.shuffle_questions THEN random()
        ELSE q.question_order::DOUBLE PRECISION
      END AS display_position,
      jsonb_build_object(
        'id', q.id,
        'question_order', q.question_order,
        'question', q.question,
        'image_path', q.image_path,
        'question_type', q.question_type,
        'points', q.points,
        'options', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', o.id,
                'option_order', o.option_order,
                'option_text', o.option_text,
                'image_path', o.image_path
              )
              ORDER BY
                CASE
                  WHEN quiz_record.shuffle_options THEN random()
                  ELSE o.option_order::DOUBLE PRECISION
                END
            ),
            '[]'::JSONB
          )
          FROM public.quiz_options AS o
          WHERE o.question_id = q.id
        )
      ) AS question_item
    FROM public.quiz_questions AS q
    WHERE q.quiz_id = target_quiz_id
  ) AS safe_questions;

  RETURN jsonb_build_object(
    'id', quiz_record.id,
    'title', quiz_record.title,
    'duration', quiz_record.duration,
    'passing_score', quiz_record.passing_score,
    'max_attempt', quiz_record.max_attempt,
    'attempts_used', attempts_used,
    'attempts_remaining', GREATEST(quiz_record.max_attempt - attempts_used, 0),
    'can_attempt', private.can_manage_quiz(target_quiz_id)
      OR attempts_used < quiz_record.max_attempt,
    'questions', question_payload
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  target_quiz_id UUID,
  submitted_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_profile_id UUID := (SELECT auth.uid());
  quiz_record public.quizzes%ROWTYPE;
  next_attempt INTEGER;
  question_total INTEGER;
  correct_total INTEGER;
  wrong_total INTEGER;
  unanswered_total INTEGER;
  total_points INTEGER;
  earned_points INTEGER;
  calculated_score NUMERIC(5,2);
  attempt_id UUID;
  best_score_value NUMERIC(5,2);
BEGIN
  IF current_profile_id IS NULL
     OR NOT private.is_active_student() THEN
    RAISE EXCEPTION 'Hanya peserta aktif yang dapat mengerjakan quiz.'
      USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(submitted_answers) <> 'array' THEN
    RAISE EXCEPTION 'Format jawaban quiz tidak valid.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO quiz_record
  FROM public.quizzes
  WHERE id = target_quiz_id
    AND publication_status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz tidak tersedia.'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT private.has_active_course_access(
    (
      SELECT lessons.course_id
      FROM public.lessons
      WHERE lessons.id = quiz_record.lesson_id
        AND lessons.publication_status = 'published'
    )
  ) THEN
    RAISE EXCEPTION 'Enrollment aktif diperlukan untuk mengerjakan quiz.'
      USING ERRCODE = '42501';
  END IF;

  -- Serialize attempts for the same participant and quiz.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      current_profile_id::TEXT || ':' || target_quiz_id::TEXT,
      0
    )
  );

  SELECT COUNT(*)::INTEGER + 1
  INTO next_attempt
  FROM public.quiz_attempts
  WHERE profile_id = current_profile_id
    AND quiz_id = target_quiz_id
    AND submitted_at IS NOT NULL;

  IF next_attempt > quiz_record.max_attempt THEN
    RAISE EXCEPTION 'Batas percobaan quiz telah tercapai.'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(submitted_answers)
      AS answer(question_id UUID, selected_option_id UUID)
    WHERE answer.selected_option_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.quiz_options AS option_row
        JOIN public.quiz_questions AS question_row
          ON question_row.id = option_row.question_id
        WHERE option_row.id = answer.selected_option_id
          AND question_row.id = answer.question_id
          AND question_row.quiz_id = target_quiz_id
      )
  ) THEN
    RAISE EXCEPTION 'Terdapat pilihan jawaban yang tidak valid.'
      USING ERRCODE = '22023';
  END IF;

  WITH normalized_answers AS (
    SELECT DISTINCT ON (answer.question_id)
      answer.question_id,
      answer.selected_option_id
    FROM jsonb_to_recordset(submitted_answers)
      AS answer(question_id UUID, selected_option_id UUID)
    ORDER BY answer.question_id
  ),
  evaluated AS (
    SELECT
      question.id AS question_id,
      question.points,
      normalized.selected_option_id,
      COALESCE(option_row.is_correct, FALSE) AS is_correct
    FROM public.quiz_questions AS question
    LEFT JOIN normalized_answers AS normalized
      ON normalized.question_id = question.id
    LEFT JOIN public.quiz_options AS option_row
      ON option_row.id = normalized.selected_option_id
      AND option_row.question_id = question.id
    WHERE question.quiz_id = target_quiz_id
  )
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (
      WHERE selected_option_id IS NOT NULL AND is_correct
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE selected_option_id IS NOT NULL AND NOT is_correct
    )::INTEGER,
    COUNT(*) FILTER (
      WHERE selected_option_id IS NULL
    )::INTEGER,
    COALESCE(SUM(points), 0)::INTEGER,
    COALESCE(SUM(points) FILTER (WHERE is_correct), 0)::INTEGER
  INTO
    question_total,
    correct_total,
    wrong_total,
    unanswered_total,
    total_points,
    earned_points
  FROM evaluated;

  IF question_total = 0 OR total_points = 0 THEN
    RAISE EXCEPTION 'Quiz belum memiliki soal yang dapat dinilai.'
      USING ERRCODE = '22023';
  END IF;

  calculated_score := ROUND(
    (earned_points::NUMERIC / total_points::NUMERIC) * 100,
    2
  );

  INSERT INTO public.quiz_attempts (
    profile_id,
    quiz_id,
    attempt_number,
    total_questions,
    total_correct,
    total_wrong,
    total_unanswered,
    score,
    started_at,
    submitted_at,
    duration_seconds
  )
  VALUES (
    current_profile_id,
    target_quiz_id,
    next_attempt,
    question_total,
    correct_total,
    wrong_total,
    unanswered_total,
    calculated_score,
    NOW(),
    NOW(),
    0
  )
  RETURNING id INTO attempt_id;

  WITH normalized_answers AS (
    SELECT DISTINCT ON (answer.question_id)
      answer.question_id,
      answer.selected_option_id
    FROM jsonb_to_recordset(submitted_answers)
      AS answer(question_id UUID, selected_option_id UUID)
    ORDER BY answer.question_id
  )
  INSERT INTO public.quiz_answers (
    attempt_id,
    question_id,
    selected_option_id,
    is_correct
  )
  SELECT
    attempt_id,
    question.id,
    normalized.selected_option_id,
    CASE
      WHEN normalized.selected_option_id IS NULL THEN NULL
      ELSE COALESCE(option_row.is_correct, FALSE)
    END
  FROM public.quiz_questions AS question
  LEFT JOIN normalized_answers AS normalized
    ON normalized.question_id = question.id
  LEFT JOIN public.quiz_options AS option_row
    ON option_row.id = normalized.selected_option_id
    AND option_row.question_id = question.id
  WHERE question.quiz_id = target_quiz_id;

  INSERT INTO public.quiz_results (
    profile_id,
    quiz_id,
    attempts_used,
    best_score,
    passed,
    first_attempt_at,
    last_attempt_at
  )
  VALUES (
    current_profile_id,
    target_quiz_id,
    next_attempt,
    calculated_score,
    calculated_score >= quiz_record.passing_score,
    NOW(),
    NOW()
  )
  ON CONFLICT (profile_id, quiz_id)
  DO UPDATE SET
    attempts_used = EXCLUDED.attempts_used,
    best_score = GREATEST(
      COALESCE(public.quiz_results.best_score, 0),
      EXCLUDED.best_score
    ),
    passed = public.quiz_results.passed OR EXCLUDED.passed,
    last_attempt_at = EXCLUDED.last_attempt_at,
    updated_at = NOW()
  RETURNING best_score INTO best_score_value;

  RETURN jsonb_build_object(
    'attempt_id', attempt_id,
    'attempt_number', next_attempt,
    'score', calculated_score,
    'best_score', best_score_value,
    'passing_score', quiz_record.passing_score,
    'passed', calculated_score >= quiz_record.passing_score,
    'attempts_remaining', GREATEST(quiz_record.max_attempt - next_attempt, 0),
    'show_review', next_attempt >= quiz_record.max_attempt
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_quiz_review(
  target_quiz_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_profile_id UUID := (SELECT auth.uid());
  quiz_record public.quizzes%ROWTYPE;
  latest_attempt_id UUID;
  attempts_used INTEGER;
  review_payload JSONB;
BEGIN
  IF current_profile_id IS NULL THEN
    RAISE EXCEPTION 'Silakan masuk untuk melihat pembahasan.'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO quiz_record
  FROM public.quizzes
  WHERE id = target_quiz_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO attempts_used
  FROM public.quiz_attempts
  WHERE profile_id = current_profile_id
    AND quiz_id = target_quiz_id
    AND submitted_at IS NOT NULL;

  IF NOT private.can_manage_quiz(target_quiz_id)
     AND attempts_used < quiz_record.max_attempt THEN
    RAISE EXCEPTION 'Pembahasan tersedia setelah percobaan terakhir.'
      USING ERRCODE = '42501';
  END IF;

  SELECT id
  INTO latest_attempt_id
  FROM public.quiz_attempts
  WHERE profile_id = current_profile_id
    AND quiz_id = target_quiz_id
    AND submitted_at IS NOT NULL
  ORDER BY attempt_number DESC
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', question.id,
        'question_order', question.question_order,
        'question', question.question,
        'explanation', question.explanation,
        'selected_option_id', answer.selected_option_id,
        'options', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', option_row.id,
                'option_order', option_row.option_order,
                'option_text', option_row.option_text,
                'is_correct', option_row.is_correct
              )
              ORDER BY option_row.option_order
            ),
            '[]'::JSONB
