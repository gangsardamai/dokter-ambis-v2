-- Course Explorer content is publish-immediately by product design.
-- Folder, lesson, and lesson file rows may no longer remain in draft state.

UPDATE public.lesson_folders
SET publication_status = 'published'
WHERE publication_status <> 'published';

UPDATE public.lessons
SET publication_status = 'published'
WHERE publication_status <> 'published';

UPDATE public.lesson_files
SET publication_status = 'published'
WHERE publication_status <> 'published';

ALTER TABLE public.lesson_folders
  ALTER COLUMN publication_status SET DEFAULT 'published';

ALTER TABLE public.lessons
  ALTER COLUMN publication_status SET DEFAULT 'published';

ALTER TABLE public.lesson_files
  ALTER COLUMN publication_status SET DEFAULT 'published';

ALTER TABLE public.lesson_folders
  DROP CONSTRAINT IF EXISTS chk_lesson_folders_publication_status;
ALTER TABLE public.lesson_folders
  ADD CONSTRAINT chk_lesson_folders_publication_status
  CHECK (publication_status = 'published');

ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS chk_lessons_publication_status;
ALTER TABLE public.lessons
  ADD CONSTRAINT chk_lessons_publication_status
  CHECK (publication_status = 'published');

ALTER TABLE public.lesson_files
  DROP CONSTRAINT IF EXISTS chk_lesson_files_publication_status;
ALTER TABLE public.lesson_files
  ADD CONSTRAINT chk_lesson_files_publication_status
  CHECK (publication_status = 'published');
