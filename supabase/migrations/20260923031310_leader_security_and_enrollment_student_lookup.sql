
-- Preserve privileged profile fields and add safe staff student lookup.

create or replace function private.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_active_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.created_at is distinct from old.created_at then
    raise exception 'Kolom role, status, id, dan created_at hanya dapat diubah Admin.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_privileged_fields on public.profiles;
create trigger trg_profiles_guard_privileged_fields
before update on public.profiles
for each row execute function private.guard_profile_privileged_fields();

create or replace function public.staff_find_student_by_phone(
  submitted_phone text
)
returns table (
  id uuid,
  full_name text,
  phone text,
  university_origin text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_phone text := regexp_replace(coalesce(submitted_phone, ''), '[^0-9]', '', 'g');
begin
  if not (
    private.is_active_admin()
    or private.leader_has_permission('manage_enrollment')
  ) then
    raise exception 'Akses pengelolaan enrollment diperlukan.'
      using errcode = '42501';
  end if;

  if length(normalized_phone) < 8 then
    raise exception 'Nomor WhatsApp tidak valid.'
      using errcode = '22023';
  end if;

  return query
  select
    p.id,
    p.full_name::text,
    p.phone::text,
    p.university_origin::text
  from public.profiles p
  where p.role = 'student'::public.profile_role
    and p.status = 'active'::public.profile_status
    and regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') = normalized_phone
  order by p.created_at asc
  limit 1;
end;
$$;

revoke all on function public.staff_find_student_by_phone(text) from public;
grant execute on function public.staff_find_student_by_phone(text) to authenticated;

-- Restore the existing audience-period guard while adding scoped Leader read access.
drop policy if exists announcements_read on public.announcements;
create policy announcements_read
on public.announcements
for select to authenticated
using (
  (select private.is_active_admin())
  or (
    (select public.current_profile_role()) = 'leader'::public.profile_role
    and (
      (select private.leader_can_manage_announcement(id))
      or (
        created_by = (select auth.uid())
        and all_students = false
        and (select private.leader_has_permission('manage_announcements'))
        and not exists (
          select 1
          from public.announcement_organizations ao
          where ao.announcement_id = announcements.id
        )
        and not exists (
          select 1
          from public.announcement_courses ac
          where ac.announcement_id = announcements.id
        )
      )
    )
  )
  or (
    is_published = true
    and starts_at <= now()
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'student'::public.profile_role
        and p.status = 'active'::public.profile_status
    )
    and (
      (
        all_students = true
        and (
          announcements.ends_at is null
          or exists (
            select 1
            from public.profiles audience_profile
            where audience_profile.id = (select auth.uid())
              and audience_profile.created_at <= announcements.ends_at
          )
        )
      )
      or exists (
        select 1
        from public.announcement_courses ac
        join public.enrollments e on e.course_id = ac.course_id
        where ac.announcement_id = announcements.id
          and e.profile_id = (select auth.uid())
          and e.status = 'active'::public.enrollment_status
          and (e.expired_at is null or e.expired_at > now())
          and (
            announcements.ends_at is null
            or coalesce(e.activated_at, e.created_at) <= announcements.ends_at
          )
      )
      or exists (
        select 1
        from public.announcement_organizations ao
        join public.courses c on c.organization_id = ao.organization_id
        join public.enrollments e on e.course_id = c.id
        where ao.announcement_id = announcements.id
          and e.profile_id = (select auth.uid())
          and e.status = 'active'::public.enrollment_status
          and (e.expired_at is null or e.expired_at > now())
          and (
            announcements.ends_at is null
            or coalesce(e.activated_at, e.created_at) <= announcements.ends_at
          )
      )
    )
  )
);
