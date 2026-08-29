alter table public.lesson_files
  drop constraint if exists uq_lesson_files_path;

alter table public.lesson_files
  add constraint uq_lesson_files_lesson_path
  unique (lesson_id, file_path);
