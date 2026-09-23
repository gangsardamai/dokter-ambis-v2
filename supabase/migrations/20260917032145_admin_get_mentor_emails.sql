create or replace function public.admin_get_mentor_emails(target_profile_ids uuid[])
returns table(profile_id uuid, email text)
language plpgsql
stable security definer
set search_path = 'public', 'auth', 'private', 'pg_temp'
as $function$
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.' using errcode = '42501';
  end if;

  if target_profile_ids is null or cardinality(target_profile_ids) = 0 then
    return;
  end if;

  return query
  select p.id as profile_id, coalesce(u.email, '')::text as email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'mentor'::public.profile_role
    and p.id = any(target_profile_ids);
end;
$function$;

grant execute on function public.admin_get_mentor_emails(uuid[]) to authenticated;
