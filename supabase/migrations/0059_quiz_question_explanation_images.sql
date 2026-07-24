-- =========================================================
-- DOKTER AMBIS
-- Migration 0059
-- File    : 0059_quiz_question_explanation_images.sql
-- Purpose : Add a private image path for quiz explanations and
--           expose authorized image references in quiz review.
-- Depends : 0058_security_performance_followup.sql
-- =========================================================

ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS explanation_image_path TEXT;

COMMENT ON COLUMN public.quiz_questions.image_path IS
  'Private object path for the image displayed with the question.';

COMMENT ON COLUMN public.quiz_questions.explanation_image_path IS
  'Private object path for the image displayed only in authorized quiz review.';

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
        'image_path', question.image_path,
        'explanation', question.explanation,
        'explanation_image_path', question.explanation_image_path,
        'selected_option_id', answer.selected_option_id,
        'options', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', option_row.id,
                'option_order', option_row.option_order,
                'option_text', option_row.option_text,
                'image_path', option_row.image_path,
                'is_correct', option_row.is_correct
              )
              ORDER BY option_row.option_order
            ),
            '[]'::JSONB
          )
          FROM public.quiz_options AS option_row
          WHERE option_row.question_id = question.id
        )
      )
      ORDER BY question.question_order
    ),
    '[]'::JSONB
  )
  INTO review_payload
  FROM public.quiz_questions AS question
  LEFT JOIN public.quiz_answers AS answer
    ON answer.question_id = question.id
    AND answer.attempt_id = latest_attempt_id
  WHERE question.quiz_id = target_quiz_id;

  RETURN jsonb_build_object(
    'quiz_id', quiz_record.id,
    'title', quiz_record.title,
    'attempts_used', attempts_used,
    'questions', review_payload
  );
END;
$$;

REVOKE ALL
ON FUNCTION public.get_quiz_review(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.get_quiz_review(UUID)
TO authenticated;
