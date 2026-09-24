-- Allow active Leaders to manage mentor-rating settings only for Courses in their scope.
-- Admin behavior is unchanged. Scope checks are enforced inside SECURITY DEFINER RPCs.

create or replace function private.can_manage_course_rating_settings(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_active_admin()
    or (
      private.is_active_leader()
      and private.leader_can_access_course(target_course_id)
    );
$$;

revoke all on function private.can_manage_course_rating_settings(uuid) from public;

create or replace function public.admin_set_mentor_rating_enabled(
  target_course_id uuid,
  target_enabled boolean
)
returns void
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $$
begin
  if not private.can_manage_course_rating_settings(target_course_id) then
    raise exception 'Course berada di luar scope Anda.'
      using errcode='42501';
  end if;

  update public.courses
  set mentor_rating_enabled = target_enabled
  where id = target_course_id;

  if not found then
    raise exception 'Course tidak ditemukan.';
  end if;

  if private.is_active_leader() then
    insert into public.leader_audit_events(
      actor_id,
      entity_type,
      entity_id,
      action,
      changes
    )
    values(
      auth.uid(),
      'course',
      target_course_id,
      'SET_MENTOR_RATING_ENABLED',
      jsonb_build_object('mentor_rating_enabled', target_enabled)
    );
  end if;
end;
$$;

create or replace function public.admin_set_course_rating_mentors(
  target_course_id uuid,
  target_mentor_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $$
declare
  selected_ids uuid[] := coalesce(target_mentor_ids, '{}'::uuid[]);
begin
  if not private.can_manage_course_rating_settings(target_course_id) then
    raise exception 'Course berada di luar scope Anda.'
      using errcode='42501';
  end if;

  if not exists(
    select 1
    from public.courses c
    where c.id = target_course_id
  ) then
    raise exception 'Course tidak ditemukan.';
  end if;

  if exists (
    select 1
    from unnest(selected_ids) selected(mentor_id)
    where not exists (
      select 1
      from public.course_mentors cm
      where cm.course_id = target_course_id
        and cm.mentor_id = selected.mentor_id
        and cm.is_active
    )
  ) then
    raise exception 'Ada mentor yang tidak ditugaskan aktif pada course ini.';
  end if;

  update public.course_mentors cm
  set show_in_rating = cm.mentor_id = any(selected_ids)
  where cm.course_id = target_course_id
    and cm.is_active;

  if private.is_active_leader() then
    insert into public.leader_audit_events(
      actor_id,
      entity_type,
      entity_id,
      action,
      changes
    )
    values(
      auth.uid(),
      'course',
      target_course_id,
      'SET_COURSE_RATING_MENTORS',
      jsonb_build_object('mentor_ids', to_jsonb(selected_ids))
    );
  end if;
end;
$$;
