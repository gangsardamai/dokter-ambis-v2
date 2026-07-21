-- =========================================================
-- DOKTER AMBIS
-- Migration 0047
-- File : 0047_update_lessons_add_folder.sql
-- Purpose : Add folder relationship to lessons
-- =========================================================

ALTER TABLE public.lessons

ADD COLUMN folder_id UUID NULL;

ALTER TABLE public.lessons

ADD CONSTRAINT fk_lessons_folder
FOREIGN KEY (folder_id)
REFERENCES public.lesson_folders(id)
ON DELETE CASCADE;

CREATE INDEX idx_lessons_folder
ON public.lessons(folder_id);