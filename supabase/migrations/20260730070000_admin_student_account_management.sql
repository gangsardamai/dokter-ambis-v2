-- Admin student directory: expose student emails to active admins and allow
-- irreversible student account deletion after exact email confirmation.

create or replace function public.admin_get_student_emails(
  target_profile_ids uuid[]
)
returns table (
  profile_id uuid,
  email text
)
language plpgsql
stable
security definer
set search_path = public, auth, private, pg_temp
as $$
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.'
      using errcode = '42501';
  end if;

  if target_profile_ids is null or cardinality(target_profile_ids) = 0 then
    return;
  end if;

  return query
  select
    p.id as profile_id,
    coalesce(u.email, '')::text as email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'student'::public.profile_role
    and p.id = any(target_profile_ids);
end;
$$;

revoke all on function public.admin_get_student_emails(uuid[]) from public;
grant execute on function public.admin_get_student_emails(uuid[]) to authenticated;

create or replace function public.admin_delete_student_account(
  target_profile_id uuid,
  confirmation_email text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, private, pg_temp
as $$
declare
  target_email text;
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

  if nullif(btrim(confirmation_email), '') is null then
    raise exception 'Email konfirmasi wajib diisi.'
      using errcode = '22023';
  end if;

  select u.email::text, p.role::text
  into target_email, target_role
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.id = target_profile_id
  for update of u, p;

  if not found then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  if target_role <> 'student' then
    raise exception 'Hanya akun mahasiswa yang dapat dihapus dari menu ini.'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(target_email, ''))) <> lower(btrim(confirmation_email)) then
    raise exception 'Email konfirmasi tidak sesuai.'
      using errcode = '22023';
  end if;

  delete from auth.users
  where id = target_profile_id;

  if not found then
    raise exception 'Akun mahasiswa gagal dihapus.';
  end if;

  return true;
end;
$$;

revoke all on function public.admin_delete_student_account(uuid, text) from public;
grant execute on function public.admin_delete_student_account(uuid, text) to authenticated;

-- The application removes the physical file through the Storage API before
-- deleting the account. This policy allows active admins to perform that step.
drop policy if exists "Admins delete payment proofs" on storage.objects;
create policy "Admins delete payment proofs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (select private.is_active_admin())
);
