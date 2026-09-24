-- Preserve the second profile protection trigger while allowing exactly one Leader transition:
-- scoped Student -> Mentor. All other role/status changes remain Admin-only.
create or replace function private.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Profile ID tidak dapat diubah.'
      using errcode = '42501';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'Waktu pembuatan profile tidak dapat diubah.'
      using errcode = '42501';
  end if;

  if not private.is_active_admin()
     and coalesce((select auth.role()), '') <> 'service_role'
     and (
       new.role is distinct from old.role
       or new.status is distinct from old.status
     ) then
    if private.is_active_leader()
       and old.role = 'student'::public.profile_role
       and new.role = 'mentor'::public.profile_role
       and new.status is not distinct from old.status
       and private.leader_can_access_student(old.id) then
      return new;
    end if;

    raise exception 'Role dan status akun hanya dapat diubah oleh admin aktif.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_profile_sensitive_fields() from public;
