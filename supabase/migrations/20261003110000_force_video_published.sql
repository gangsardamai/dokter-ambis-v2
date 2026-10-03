-- Videos are publish-immediately by product design.
-- Existing draft videos are published, and future rows cannot remain in draft state.

UPDATE public.videos
SET publication_status = 'published'
WHERE publication_status <> 'published';

ALTER TABLE public.videos
  ALTER COLUMN publication_status SET DEFAULT 'published';

ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS chk_videos_publication_status;

ALTER TABLE public.videos
  ADD CONSTRAINT chk_videos_publication_status
  CHECK (publication_status = 'published');
