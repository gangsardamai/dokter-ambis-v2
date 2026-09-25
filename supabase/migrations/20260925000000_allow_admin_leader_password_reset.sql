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
    raise exception 'Akun tidak ditemukan.'
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
    raise exception 'Akun tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  if target_role not in ('student', 'leader') then
    raise exception 'Password dari menu ini hanya dapat diubah untuk akun mahasiswa atau Leader.'
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
    raise exception 'Password gagal diubah.'
      using errcode = 'P0002';
  end if;

  return true;
end;
$function$;

revoke all on function public.admin_set_student_password(uuid, text) from public;
revoke all on function public.admin_set_student_password(uuid, text) from anon;
grant execute on function public.admin_set_student_password(uuid, text) to authenticated;
