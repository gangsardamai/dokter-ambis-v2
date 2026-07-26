begin;

-- Migration 0073 is the canonical Try Out image-path guard.
-- Remove the legacy quiz-images guard so it cannot reject valid tryout-images paths.
drop trigger if exists trg_guard_tryout_question_image_paths
  on public.tryout_questions;

drop function if exists private.guard_tryout_question_image_paths();

commit;
