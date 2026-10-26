-- Atomic Google Drive ID replacement for authenticated, active Admins.
-- This migration is intentionally restricted to the UNEJ 2026 pilot courses.
-- Google Drive copy/permission checks must be performed by the server BEFORE calling this function.
create or replace function public.admin_replace_drive_references(
  p_course_id uuid,
  p_old_id text,
  p_new_id text
)
returns table (files_updated integer, videos_updated integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_files integer := 0;
  v_videos integer := 0;
begin
  if (select auth.uid()) is null or not (select private.is_active_admin()) then
    raise exception 'Admin aktif diperlukan' using errcode = '42501';
  end if;
  if p_course_id not in (
    'aa4a2839-c6d1-4afb-8c2c-7732bb0e446d'::uuid, -- UNEJ Blok 2
    '50b4ef9e-e572-494c-ae81-e22a8c2c47ea'::uuid, -- UNEJ Blok 8
    'b575f68c-8bcb-4f98-ab0f-0f51b96a5207'::uuid  -- UNEJ Blok 14
  ) then
    raise exception 'Course di luar pilot UNEJ';
  end if;
  if p_old_id !~ '^[A-Za-z0-9_-]{10,}$'
    or p_new_id !~ '^[A-Za-z0-9_-]{10,}$'
    or p_old_id = p_new_id
  then
    raise exception 'Google Drive ID tidak valid';
  end if;
  -- Refuse to edit a random file unrelated to the requested course.
  if not exists (
    select 1 from public.lesson_files lf
    join public.lessons l on l.id = lf.lesson_id
    where l.course_id = p_course_id and strpos(lf.file_path, p_old_id) > 0
  ) and not exists (
    select 1 from public.videos v
    join public.lessons l on l.id = v.lesson_id
    where l.course_id = p_course_id
      and v.provider = 'google_drive'
      and v.provider_video_id = p_old_id
  ) then
    raise exception 'File asli tidak terhubung ke course UNEJ yang dipilih';
  end if;
  -- A preexisting destination ID may point to another resource; never merge those blindly.
  if exists (select 1 from public.lesson_files where strpos(file_path, p_new_id) > 0)
    or exists (select 1 from public.videos where provider = 'google_drive' and provider_video_id = p_new_id)
  then
    raise exception 'ID salinan sudah digunakan dalam database';
  end if;
  -- Abort if old ID is embedded in an unsupported file reference format.
  if exists (
    select 1 from public.lesson_files
    where strpos(file_path, p_old_id) > 0
      and file_path <> ('google-drive://' || p_old_id)
      and file_path not like 'https://drive.google.com/%'
      and file_path not like 'https://www.drive.google.com/%'
  ) then
    raise exception 'Referensi Google Drive dengan format tidak didukung';
  end if;
  update public.lesson_files
    set file_path = replace(file_path, p_old_id, p_new_id)
    where file_path = ('google-drive://' || p_old_id)
       or ((file_path like 'https://drive.google.com/%'
          or file_path like 'https://www.drive.google.com/%')
          and strpos(file_path, p_old_id) > 0);
  get diagnostics v_files = row_count;
  update public.videos
    set provider_video_id = p_new_id
    where provider = 'google_drive' and provider_video_id = p_old_id;
  get diagnostics v_videos = row_count;
  if (v_files + v_videos) < 1 then
    raise exception 'Tidak ada referensi untuk diubah';
  end if;
  -- Any failure in these checks rolls BOTH updates back atomically.
  if exists (select 1 from public.lesson_files where strpos(file_path, p_old_id) > 0)
    or exists (select 1 from public.videos where provider = 'google_drive' and provider_video_id = p_old_id)
  then
    raise exception 'ID lama masih memiliki referensi; transaksi dibatalkan';
  end if;
  return query select v_files, v_videos;
end;
$$;
revoke all on function public.admin_replace_drive_references(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_replace_drive_references(uuid, text, text) to authenticated;
