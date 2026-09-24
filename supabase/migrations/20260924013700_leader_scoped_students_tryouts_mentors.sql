-- Leader operational access: Student Data, Try Out, and Mentor assignment.
-- Scope is the single source of truth for these three capabilities.
-- Organization scope inherits programs/courses; program scope inherits courses; course scope stays local.

create or replace function private.leader_can_access_student(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_active_leader()
    and exists (
      select 1
      from public.enrollments e
      join public.profiles p on p.id = e.profile_id
      where e.profile_id = target_profile_id
        and p.role = 'student'::public.profile_role
        and private.leader_can_access_course(e.course_id)
    );
$$;

revoke all on function private.leader_can_access_student(uuid) from public;

create or replace function private.can_manage_student_account(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_active_admin()
    or private.leader_can_access_student(target_profile_id);
$$;

revoke all on function private.can_manage_student_account(uuid) from public;

create or replace function private.leader_can_access_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.leader_can_access_student(target_profile_id)
    or (
      private.is_active_leader()
      and private.leader_has_permission('manage_messages')
      and exists (
        select 1
        from public.lesson_message_threads t
        where t.student_profile_id = target_profile_id
          and private.leader_can_access_course(t.course_id)
      )
    );
$$;

revoke all on function private.leader_can_access_profile(uuid) from public;
grant execute on function private.leader_can_access_profile(uuid) to authenticated;

-- Reading Student Data follows scope even when the optional Enrollment-management
-- permission is disabled. Enrollment writes remain governed by the existing permission.
alter policy "enrollments_read_authorized"
on public.enrollments
using (
  (select private.is_active_admin())
  or profile_id = (select auth.uid())
  or (select private.leader_can_access_course(enrollments.course_id))
);

create or replace function public.admin_get_student_emails(target_profile_ids uuid[])
returns table(profile_id uuid, email text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (private.is_active_admin() or private.is_active_leader()) then
    raise exception 'Anda tidak memiliki izin mengakses data mahasiswa.'
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
    and p.id = any(target_profile_ids)
    and private.can_manage_student_account(p.id);
end;
$$;

revoke all on function public.admin_get_student_emails(uuid[]) from public, anon;
grant execute on function public.admin_get_student_emails(uuid[]) to authenticated;

-- Preserve the general privileged-field guard, but allow the one explicit Leader
-- role transition requested by the product: scoped Student -> Mentor.
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

  if private.is_active_leader()
     and old.role = 'student'::public.profile_role
     and new.role = 'mentor'::public.profile_role
     and new.id is not distinct from old.id
     and new.status is not distinct from old.status
     and new.created_at is not distinct from old.created_at
     and private.leader_can_access_student(old.id) then
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

revoke all on function private.guard_profile_privileged_fields() from public;

create or replace function public.admin_reset_student_devices(target_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
  deleted_count integer := 0;
begin
  if not private.can_manage_student_account(target_profile_id) then
    raise exception 'Mahasiswa berada di luar scope Anda.'
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

  insert into public.device_session_audit (
    profile_id,
    device_session_id,
    device_identifier,
    device_name,
    device_type,
    ip_address,
    user_agent,
    last_login_at,
    last_activity_at,
    event_type,
    actor_profile_id
  )
  select
    ds.profile_id,
    ds.id,
    ds.device_identifier,
    ds.device_name,
    ds.device_type,
    ds.ip_address,
    ds.user_agent,
    ds.last_login_at,
    ds.last_activity_at,
    'admin_reset',
    auth.uid()
  from public.device_sessions ds
  where ds.profile_id = target_profile_id;

  delete from public.device_sessions
  where profile_id = target_profile_id;

  get diagnostics deleted_count = row_count;

  if private.is_active_leader() then
    insert into public.leader_audit_events(
      actor_id, entity_type, entity_id, action, changes
    )
    values (
      auth.uid(),
      'student',
      target_profile_id,
      'RESET_DEVICES',
      jsonb_build_object('deleted_count', deleted_count)
    );
  end if;

  return deleted_count;
end;
$$;

revoke all on function public.admin_reset_student_devices(uuid) from public, anon;
grant execute on function public.admin_reset_student_devices(uuid) to authenticated;

create or replace function public.admin_set_student_password(
  target_profile_id uuid,
  new_password text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
begin
  if not private.can_manage_student_account(target_profile_id) then
    raise exception 'Mahasiswa berada di luar scope Anda.'
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

  if private.is_active_leader() then
    insert into public.leader_audit_events(
      actor_id, entity_type, entity_id, action, changes
    )
    values (
      auth.uid(),
      'student',
      target_profile_id,
      'RESET_PASSWORD',
      jsonb_build_object('_changed_fields', jsonb_build_array('password'))
    );
  end if;

  return true;
end;
$$;

revoke all on function public.admin_set_student_password(uuid, text) from public, anon;
grant execute on function public.admin_set_student_password(uuid, text) to authenticated;

create or replace function public.admin_promote_student_to_mentor(target_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
  mentor_detail_id uuid;
begin
  if not private.can_manage_student_account(target_profile_id) then
    raise exception 'Mahasiswa berada di luar scope Anda.'
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
$$;

revoke all on function public.admin_promote_student_to_mentor(uuid) from public, anon;
grant execute on function public.admin_promote_student_to_mentor(uuid) to authenticated;

-- Mentor assignment is scoped by the target Course. Leader may choose any Mentor,
-- but never sees or mutates assignment context from courses outside their scope.
alter policy "course_mentors_authorized_select"
on public.course_mentors
using (
  (select private.is_active_admin())
  or exists (
    select 1
    from public.mentor_details
    where mentor_details.id = course_mentors.mentor_id
      and mentor_details.profile_id = (select auth.uid())
  )
  or (
    private.is_active_leader()
    and private.leader_can_access_course(course_mentors.course_id)
  )
);

create or replace function public.admin_set_mentor_assignment(
  target_profile_id uuid,
  target_course_id uuid,
  target_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_mentor_id uuid;
begin
  if not (
    private.is_active_admin()
    or (
      private.is_active_leader()
      and private.leader_can_access_course(target_course_id)
    )
  ) then
    raise exception 'Course berada di luar scope Anda.'
      using errcode = '42501';
  end if;

  select md.id into target_mentor_id
  from public.mentor_details md
  join public.profiles p on p.id = md.profile_id
  where md.profile_id = target_profile_id
    and p.role = 'mentor'::public.profile_role;

  if target_mentor_id is null then
    raise exception 'Mentor tidak ditemukan.';
  end if;

  if not exists(select 1 from public.courses where id = target_course_id) then
    raise exception 'Course tidak ditemukan.';
  end if;

  if target_active then
    insert into public.course_mentors(
      course_id, mentor_id, is_active, removed_at, show_in_rating
    )
    values(target_course_id, target_mentor_id, true, null, true)
    on conflict(course_id, mentor_id) do update
      set is_active = true,
          removed_at = null,
          show_in_rating = true;
  else
    update public.course_mentors
    set is_active = false,
        removed_at = now()
    where course_id = target_course_id
      and mentor_id = target_mentor_id;
  end if;

  if private.is_active_leader() then
    insert into public.leader_audit_events(
      actor_id, entity_type, entity_id, action, changes
    )
    values (
      auth.uid(),
      'course_mentor',
      target_course_id,
      case when target_active then 'ASSIGN_MENTOR' else 'REMOVE_MENTOR' end,
      jsonb_build_object(
        'mentor_profile_id', target_profile_id,
        'course_id', target_course_id,
        'active', target_active
      )
    );
  end if;
end;
$$;

revoke all on function public.admin_set_mentor_assignment(uuid, uuid, boolean) from public, anon;
grant execute on function public.admin_set_mentor_assignment(uuid, uuid, boolean) to authenticated;

create or replace function public.admin_get_mentor_directory()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  actor_is_admin boolean := private.is_active_admin();
  actor_is_leader boolean := private.is_active_leader();
begin
  if not (actor_is_admin or actor_is_leader) then
    raise exception 'Anda tidak memiliki izin mengakses data mentor.'
      using errcode = '42501';
  end if;

  select jsonb_build_object(
    'mentors', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'profileId', p.id,
          'mentorId', md.id,
          'fullName', p.full_name,
          'email', case
            when actor_is_admin or exists (
              select 1
              from public.course_mentors scoped_cm
              where scoped_cm.mentor_id = md.id
                and private.leader_can_access_course(scoped_cm.course_id)
            )
              then coalesce(u.email, '')
            else ''
          end,
          'status', p.status,
          'averageRating', coalesce(stats.avg_rating, 0),
          'ratingCount', coalesce(stats.rating_count, 0),
          'courses', coalesce(assignments.courses, '[]'::jsonb)
        )
        order by p.full_name
      )
      from public.mentor_details md
      join public.profiles p
        on p.id = md.profile_id
       and p.role = 'mentor'::public.profile_role
      join auth.users u on u.id = p.id
      left join lateral (
        select
          round(avg(mr.rating)::numeric, 2) avg_rating,
          count(*) rating_count
        from public.mentor_reviews mr
        where mr.mentor_id = md.id
          and (
            actor_is_admin
            or private.leader_can_access_course(mr.course_id)
          )
      ) stats on true
      left join lateral (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'title', c.title,
            'organizationId', o.id,
            'organizationTitle', o.title,
            'organizationShortName', o.short_name,
            'programId', pr.id,
            'programTitle', pr.title,
            'isActive', cm.is_active,
            'showInRating', cm.show_in_rating,
            'assignedAt', cm.created_at,
            'removedAt', cm.removed_at
          )
          order by cm.is_active desc, o.title, c.title
        ) courses
        from public.course_mentors cm
        join public.courses c on c.id = cm.course_id
        join public.organizations o on o.id = c.organization_id
        join public.programs pr on pr.id = c.program_id
        where cm.mentor_id = md.id
          and (
            actor_is_admin
            or private.leader_can_access_course(c.id)
          )
      ) assignments on true
    ), '[]'::jsonb),
    'courses', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'organizationId', o.id,
          'organizationTitle', o.title,
          'organizationShortName', o.short_name,
          'programId', pr.id,
          'programTitle', pr.title
        )
        order by o.title, pr.title, c.title
      )
      from public.courses c
      join public.organizations o on o.id = c.organization_id
      join public.programs pr on pr.id = c.program_id
      where actor_is_admin
         or private.leader_can_access_course(c.id)
    ), '[]'::jsonb),
    'organizations', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'title', o.title,
          'shortName', o.short_name
        )
        order by o.title
      )
      from public.organizations o
      where actor_is_admin
         or exists (
           select 1
           from public.courses c
           where c.organization_id = o.id
             and private.leader_can_access_course(c.id)
         )
    ), '[]'::jsonb),
    'programs', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pr.id,
          'title', pr.title,
          'organizationId', pr.organization_id
        )
        order by pr.title
      )
      from public.programs pr
      where actor_is_admin
         or exists (
           select 1
           from public.courses c
           where c.program_id = pr.id
             and private.leader_can_access_course(c.id)
         )
    ), '[]'::jsonb)
  )
  into result;

  return result;
end;
$$;

revoke all on function public.admin_get_mentor_directory() from public, anon;
grant execute on function public.admin_get_mentor_directory() to authenticated;

create or replace function public.admin_get_mentor_detail(target_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  actor_is_admin boolean := private.is_active_admin();
  actor_is_leader boolean := private.is_active_leader();
begin
  if not (actor_is_admin or actor_is_leader) then
    raise exception 'Anda tidak memiliki izin mengakses data mentor.'
      using errcode = '42501';
  end if;

  select jsonb_build_object(
    'profileId', p.id,
    'mentorId', md.id,
    'fullName', p.full_name,
    'email', case
      when actor_is_admin or exists (
        select 1
        from public.course_mentors scoped_cm
        where scoped_cm.mentor_id = md.id
          and private.leader_can_access_course(scoped_cm.course_id)
      )
        then coalesce(u.email, '')
      else ''
    end,
    'status', p.status,
    'averageRating', coalesce((
      select round(avg(mr.rating)::numeric, 2)
      from public.mentor_reviews mr
      where mr.mentor_id = md.id
        and (
          actor_is_admin
          or private.leader_can_access_course(mr.course_id)
        )
    ), 0),
    'ratingCount', (
      select count(*)
      from public.mentor_reviews mr
      where mr.mentor_id = md.id
        and (
          actor_is_admin
          or private.leader_can_access_course(mr.course_id)
        )
    ),
    'assignments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'courseId', c.id,
          'courseTitle', c.title,
          'organizationTitle', o.title,
          'programTitle', pr.title,
          'isActive', cm.is_active,
          'assignedAt', cm.created_at,
          'removedAt', cm.removed_at,
          'averageRating', coalesce(rs.avg_rating, 0),
          'ratingCount', coalesce(rs.rating_count, 0)
        )
        order by cm.is_active desc, o.title, c.title
      )
      from public.course_mentors cm
      join public.courses c on c.id = cm.course_id
      join public.organizations o on o.id = c.organization_id
      join public.programs pr on pr.id = c.program_id
      left join lateral (
        select
          round(avg(mr.rating)::numeric, 2) avg_rating,
          count(*) rating_count
        from public.mentor_reviews mr
        where mr.mentor_id = md.id
          and mr.course_id = c.id
      ) rs on true
      where cm.mentor_id = md.id
        and (
          actor_is_admin
          or private.leader_can_access_course(c.id)
        )
    ), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', mr.id,
          'courseId', c.id,
          'courseTitle', c.title,
          'reviewerName', case
            when mr.reviewer_type = 'admin' then 'Admin'
            else rp.full_name
          end,
          'reviewerType', mr.reviewer_type,
          'rating', mr.rating,
          'suggestion', mr.suggestion,
          'updatedAt', mr.updated_at
        )
        order by mr.updated_at desc
      )
      from public.mentor_reviews mr
      join public.courses c on c.id = mr.course_id
      join public.profiles rp on rp.id = mr.reviewer_profile_id
      where mr.mentor_id = md.id
        and (
          actor_is_admin
          or private.leader_can_access_course(c.id)
        )
    ), '[]'::jsonb)
  )
  into result
  from public.mentor_details md
  join public.profiles p on p.id = md.profile_id
  join auth.users u on u.id = p.id
  where p.id = target_profile_id
    and p.role = 'mentor'::public.profile_role;

  return result;
end;
$$;

revoke all on function public.admin_get_mentor_detail(uuid) from public, anon;
grant execute on function public.admin_get_mentor_detail(uuid) to authenticated;

-- Try Out manager access now includes active Leaders for any Try Out whose Course
-- is in their inherited scope. Mentor ownership rules stay unchanged.
create or replace function public.can_manage_tryout(target_tryout_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tryouts t
    where t.id = target_tryout_id
      and (
        private.is_active_admin()
        or (
          private.is_active_leader()
          and private.leader_can_access_course(t.course_id)
        )
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and t.created_by = (select auth.uid())
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  );
$$;

revoke all on function public.can_manage_tryout(uuid) from public, anon;
grant execute on function public.can_manage_tryout(uuid) to authenticated;

alter policy "tryouts_select"
on public.tryouts
using (
  private.is_active_admin()
  or (
    private.is_active_leader()
    and private.leader_can_access_course(tryouts.course_id)
  )
  or (
    (select current_profile_role()) = 'mentor'::profile_role
    and created_by = (select auth.uid())
    and is_assigned_mentor((select auth.uid()), course_id)
  )
  or (
    (select current_profile_role()) = 'student'::profile_role
    and publication_status = any(array['scheduled'::text, 'published'::text, 'closed'::text])
    and exists (
      select 1
      from enrollments e
      where e.profile_id = (select auth.uid())
        and e.course_id = tryouts.course_id
        and e.status = 'active'::enrollment_status
        and (e.expired_at is null or e.expired_at > now())
    )
  )
);

alter policy "tryouts_manager_insert"
on public.tryouts
with check (
  created_by = (select auth.uid())
  and (
    private.is_active_admin()
    or (
      private.is_active_leader()
      and private.leader_can_access_course(tryouts.course_id)
    )
    or (
      (select current_profile_role()) = 'mentor'::profile_role
      and is_assigned_mentor((select auth.uid()), course_id)
    )
  )
);

alter policy "tryouts_manager_update"
on public.tryouts
using (
  private.is_active_admin()
  or (
    private.is_active_leader()
    and private.leader_can_access_course(tryouts.course_id)
  )
  or (
    (select current_profile_role()) = 'mentor'::profile_role
    and created_by = (select auth.uid())
    and is_assigned_mentor((select auth.uid()), course_id)
  )
)
with check (
  private.is_active_admin()
  or (
    private.is_active_leader()
    and private.leader_can_access_course(tryouts.course_id)
  )
  or (
    (select current_profile_role()) = 'mentor'::profile_role
    and created_by = (select auth.uid())
    and is_assigned_mentor((select auth.uid()), course_id)
  )
);

alter policy "tryouts_manager_delete"
on public.tryouts
using (
  private.is_active_admin()
  or (
    private.is_active_leader()
    and private.leader_can_access_course(tryouts.course_id)
  )
  or (
    (select current_profile_role()) = 'mentor'::profile_role
    and created_by = (select auth.uid())
    and is_assigned_mentor((select auth.uid()), course_id)
  )
);

alter policy "tryout_attempts_select"
on public.tryout_attempts
using (
  public.can_manage_tryout(tryout_attempts.tryout_id)
  or (
    profile_id = (select auth.uid())
    and (
      status = 'in_progress'::text
      or exists (
        select 1
        from tryouts t
        where t.id = tryout_attempts.tryout_id
          and (
            t.result_release_mode = 'immediate'::text
            or (
              t.result_release_mode = 'after_close'::text
              and t.close_at is not null
              and now() >= t.close_at
            )
          )
      )
    )
  )
);

alter policy "tryout_results_select"
on public.tryout_results
using (
  public.can_manage_tryout(tryout_results.tryout_id)
  or (
    profile_id = (select auth.uid())
    and exists (
      select 1
      from tryouts t
      where t.id = tryout_results.tryout_id
        and (
          t.result_release_mode = 'immediate'::text
          or (
            t.result_release_mode = 'after_close'::text
            and t.close_at is not null
            and now() >= t.close_at
          )
        )
    )
  )
);

create or replace function private.can_manage_tryout_image_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_course_id uuid;
  target_tryout_id uuid;
  folder_segment text;
  tryout_segment text;
  image_kind text;
  file_name text;
begin
  target_course_id := private.course_id_from_storage_path(object_name);
  folder_segment := split_part(object_name, '/', 2);
  tryout_segment := split_part(object_name, '/', 3);
  image_kind := split_part(object_name, '/', 4);
  file_name := split_part(object_name, '/', 5);

  if target_course_id is null
     or folder_segment not in ('quiz-images', 'tryout-images')
     or tryout_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or image_kind not in ('question', 'explanation')
     or file_name = ''
     or split_part(object_name, '/', 6) <> ''
     or position('..' in object_name) > 0
     or lower(file_name) !~ '\\.(jpg|jpeg|png|webp)$' then
    return false;
  end if;

  target_tryout_id := tryout_segment::uuid;

  return exists (
    select 1
    from public.tryouts t
    where t.id = target_tryout_id
      and t.course_id = target_course_id
      and (
        private.is_active_admin()
        or (
          private.is_active_leader()
          and private.leader_can_access_course(t.course_id)
        )
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and t.created_by = (select auth.uid())
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  );
end;
$$;

revoke all on function private.can_manage_tryout_image_object(text) from public;
grant execute on function private.can_manage_tryout_image_object(text) to authenticated;

-- Extend the existing append-only Leader audit to Try Out row changes.
drop trigger if exists trg_audit_leader_change on public.tryouts;
create trigger trg_audit_leader_change
after insert or update or delete on public.tryouts
for each row execute function private.audit_leader_change();
