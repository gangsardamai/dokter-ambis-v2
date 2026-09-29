alter table public.lesson_files
  add column if not exists access_mode text not null default 'normal';

alter table public.lesson_files
  drop constraint if exists lesson_files_access_mode_check;

alter table public.lesson_files
  add constraint lesson_files_access_mode_check
  check (access_mode in ('normal', 'locked'));
