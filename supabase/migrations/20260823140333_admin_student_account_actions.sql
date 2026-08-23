-- =========================================================
-- DOKTER AMBIS
-- Admin student account actions
-- Reset devices, set password, and promote student to mentor
-- =========================================================

create or replace function public.admin_reset_student_devices(target_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public', 'auth', 'private', 'pg_temp'
as $function$
declare
  target_role text;
  deleted_count integer := 0;
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.'
      using errcode = '42501';
  end if;

  if target_profile_id is null then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = '22023';
  end if;

  select p.role::text
  into target_role
  from public.profiles p
  where p.id = target_profile_id
  for update;

  if not found then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  if target_role <> 'student' then
    raise exception 'Reset device hanya dapat dilakukan untuk akun mahasiswa.'
      using errcode = '42501';
  end if;

  delete from public.device_sessions
  where profile_id = target_profile_id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$;

revoke all on function public.admin_reset_student_devices(uuid) from public;
revoke all on function public.admin_reset_student_devices(uuid) from anon;
grant execute on function public.admin_reset_student_devices(uuid) to authenticated;

create or replace function public.admin_set_student_password(
  target_profile_id uuid,
  new_password text
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'auth', 'private', 'extensions', 'pg_temp'
as $function$
declare
  target_role text;
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.'
      using errcode = '42501';
  end if;

  if target_profile_id is null then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = '22023';
  end if;

  if new_password is null or length(btrim(new_password)) < 6 then
    raise exception 'Password baru minimal 6 karakter.'
      using errcode = '22023';
  end if;

  if octet_length(new_password) > 72 then
    raise exception 'Password baru maksimal 72 byte.'
      using errcode = '22023';
  end if;

  select p.role::text
  into target_role
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = target_profile_id
  for update of p, u;

  if not found then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  if target_role <> 'student' then
    raise exception 'Password dari menu ini hanya dapat diubah untuk akun mahasiswa.'
      using errcode = '42501';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(
        new_password,
        extensions.gen_salt('bf', 10)
      ),
      updated_at = now()
  where id = target_profile_id;

  if not found then
    raise exception 'Password mahasiswa gagal diubah.';
  end if;

  return true;
end;
$function$;

revoke all on function public.admin_set_student_password(uuid, text) from public;
revoke all on function public.admin_set_student_password(uuid, text) from anon;
grant execute on function public.admin_set_student_password(uuid, text) to authenticated;

create or replace function public.admin_promote_student_to_mentor(target_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth', 'private', 'pg_temp'
as $function$
declare
  target_role text;
  mentor_detail_id uuid;
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.'
      using errcode = '42501';
  end if;

  if target_profile_id is null then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = '22023';
  end if;

  select p.role::text
  into target_role
  from public.profiles p
  where p.id = target_profile_id
  for update;

  if not found then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  if target_role <> 'student' then
    raise exception 'Hanya akun mahasiswa yang dapat dijadikan mentor dari menu ini.'
      using errcode = '42501';
  end if;

  update public.profiles
  set role = 'mentor'::public.profile_role,
      updated_at = now()
  where id = target_profile_id;

  insert into public.mentor_details (profile_id)
  values (target_profile_id)
  on conflict (profile_id)
  do update set updated_at = now()
  returning id into mentor_detail_id;

  return mentor_detail_id;
end;
$function$;

revoke all on function public.admin_promote_student_to_mentor(uuid) from public;
revoke all on function public.admin_promote_student_to_mentor(uuid) from anon;
grant execute on function public.admin_promote_student_to_mentor(uuid) to authenticated;
