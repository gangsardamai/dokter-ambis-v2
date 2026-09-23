
-- Leader scoped-admin foundation

create table if not exists public.leader_scopes (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid null references public.organizations(id) on delete cascade,
  program_id uuid null references public.programs(id) on delete cascade,
  course_id uuid null references public.courses(id) on delete cascade,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint leader_scopes_exactly_one_target check (
    num_nonnulls(organization_id, program_id, course_id) = 1
  )
);

create unique index if not exists leader_scopes_unique_organization
  on public.leader_scopes(leader_id, organization_id)
  where organization_id is not null;
create unique index if not exists leader_scopes_unique_program
  on public.leader_scopes(leader_id, program_id)
  where program_id is not null;
create unique index if not exists leader_scopes_unique_course
  on public.leader_scopes(leader_id, course_id)
  where course_id is not null;
create index if not exists leader_scopes_leader_idx
  on public.leader_scopes(leader_id);
create index if not exists leader_scopes_organization_idx
  on public.leader_scopes(organization_id, leader_id)
  where organization_id is not null;
create index if not exists leader_scopes_program_idx
  on public.leader_scopes(program_id, leader_id)
  where program_id is not null;
create index if not exists leader_scopes_course_idx
  on public.leader_scopes(course_id, leader_id)
  where course_id is not null;

create table if not exists public.leader_permissions (
  leader_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null,
  enabled boolean not null default true,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (leader_id, permission),
  constraint leader_permissions_permission_check check (
    permission in (
      'manage_master_data',
      'manage_enrollment',
      'manage_messages',
      'manage_announcements'
    )
  )
);

create index if not exists leader_permissions_enabled_idx
  on public.leader_permissions(leader_id, permission)
  where enabled = true;

drop trigger if exists trg_leader_permissions_updated_at on public.leader_permissions;
create trigger trg_leader_permissions_updated_at
before update on public.leader_permissions
for each row execute function public.update_updated_at_column();

alter table public.leader_scopes enable row level security;
alter table public.leader_permissions enable row level security;

grant select, insert, update, delete on public.leader_scopes to authenticated;
grant select, insert, update, delete on public.leader_permissions to authenticated;

-- Audit ownership for scoped master data.
alter table public.organizations
  add column if not exists created_by uuid null references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid null references public.profiles(id) on delete set null;
alter table public.programs
  add column if not exists created_by uuid null references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid null references public.profiles(id) on delete set null;
alter table public.courses
  add column if not exists created_by uuid null references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid null references public.profiles(id) on delete set null;

create or replace function private.is_active_leader()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'leader'::public.profile_role
      and status = 'active'::public.profile_status
  );
$$;

create or replace function private.leader_has_permission(target_permission text)
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
      from public.leader_permissions lp
      where lp.leader_id = (select auth.uid())
        and lp.permission = target_permission
        and lp.enabled = true
    );
$$;

create or replace function private.leader_can_access_organization(target_organization_id uuid)
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
      from public.leader_scopes ls
      where ls.leader_id = (select auth.uid())
        and (
          ls.organization_id = target_organization_id
          or exists (
            select 1
            from public.programs p
            where p.id = ls.program_id
              and p.organization_id = target_organization_id
          )
          or exists (
            select 1
            from public.courses c
            where c.id = ls.course_id
              and c.organization_id = target_organization_id
          )
        )
    );
$$;

create or replace function private.leader_can_access_program(target_program_id uuid)
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
      from public.programs target_program
      where target_program.id = target_program_id
        and exists (
          select 1
          from public.leader_scopes ls
          where ls.leader_id = (select auth.uid())
            and (
              ls.organization_id = target_program.organization_id
              or ls.program_id = target_program.id
              or exists (
                select 1
                from public.courses c
                where c.id = ls.course_id
                  and c.program_id = target_program.id
              )
            )
        )
    );
$$;

create or replace function private.leader_can_access_course(target_course_id uuid)
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
      from public.courses target_course
      where target_course.id = target_course_id
        and exists (
          select 1
          from public.leader_scopes ls
          where ls.leader_id = (select auth.uid())
            and (
              ls.organization_id = target_course.organization_id
              or ls.program_id = target_course.program_id
              or ls.course_id = target_course.id
            )
        )
    );
$$;

create or replace function private.leader_can_manage_course_for(
  target_course_id uuid,
  target_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.leader_has_permission(target_permission)
    and private.leader_can_access_course(target_course_id);
$$;

create or replace function private.leader_can_access_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_active_leader()
    and (
      (
        private.leader_has_permission('manage_enrollment')
        and exists (
          select 1
          from public.enrollments e
          where e.profile_id = target_profile_id
            and private.leader_can_access_course(e.course_id)
        )
      )
      or
      (
        private.leader_has_permission('manage_messages')
        and exists (
          select 1
          from public.lesson_message_threads t
          where t.student_profile_id = target_profile_id
            and private.leader_can_access_course(t.course_id)
        )
      )
    );
$$;

create or replace function private.leader_can_manage_enrollment(target_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.leader_has_permission('manage_enrollment')
    and exists (
      select 1
      from public.enrollments e
      where e.id = target_enrollment_id
        and private.leader_can_access_course(e.course_id)
    );
$$;

create or replace function private.leader_can_manage_announcement(target_announcement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.leader_has_permission('manage_announcements')
    and exists (
      select 1
      from public.announcements a
      where a.id = target_announcement_id
        and a.all_students = false
        and (
          exists (
            select 1 from public.announcement_organizations ao
            where ao.announcement_id = a.id
          )
          or exists (
            select 1 from public.announcement_courses ac
            where ac.announcement_id = a.id
          )
        )
        and not exists (
          select 1
          from public.announcement_organizations ao
          where ao.announcement_id = a.id
            and not private.leader_can_access_organization(ao.organization_id)
        )
        and not exists (
          select 1
          from public.announcement_courses ac
          where ac.announcement_id = a.id
            and not private.leader_can_access_course(ac.course_id)
        )
    );
$$;

revoke all on function private.is_active_leader() from public;
revoke all on function private.leader_has_permission(text) from public;
revoke all on function private.leader_can_access_organization(uuid) from public;
revoke all on function private.leader_can_access_program(uuid) from public;
revoke all on function private.leader_can_access_course(uuid) from public;
revoke all on function private.leader_can_manage_course_for(uuid,text) from public;
revoke all on function private.leader_can_access_profile(uuid) from public;
revoke all on function private.leader_can_manage_enrollment(uuid) from public;
revoke all on function private.leader_can_manage_announcement(uuid) from public;

grant execute on function private.is_active_leader() to authenticated;
grant execute on function private.leader_has_permission(text) to authenticated;
grant execute on function private.leader_can_access_organization(uuid) to authenticated;
grant execute on function private.leader_can_access_program(uuid) to authenticated;
grant execute on function private.leader_can_access_course(uuid) to authenticated;
grant execute on function private.leader_can_manage_course_for(uuid,text) to authenticated;
grant execute on function private.leader_can_access_profile(uuid) to authenticated;
grant execute on function private.leader_can_manage_enrollment(uuid) to authenticated;
grant execute on function private.leader_can_manage_announcement(uuid) to authenticated;

-- Initialize agreed Leader permissions when a profile becomes a Leader.
create or replace function private.initialize_leader_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'leader'::public.profile_role
     and (tg_op = 'INSERT' or old.role is distinct from new.role) then
    insert into public.leader_permissions
      (leader_id, permission, enabled, created_by)
    values
      (new.id, 'manage_master_data', true, (select auth.uid())),
      (new.id, 'manage_enrollment', true, (select auth.uid())),
      (new.id, 'manage_messages', true, (select auth.uid())),
      (new.id, 'manage_announcements', true, (select auth.uid()))
    on conflict (leader_id, permission)
    do update set enabled = true, updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_initialize_leader_permissions on public.profiles;
create trigger trg_initialize_leader_permissions
after insert or update of role on public.profiles
for each row execute function private.initialize_leader_permissions();

-- Audit creator/editor for new changes.
create or replace function private.set_master_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then
      new.created_by := (select auth.uid());
    end if;
    new.updated_by := coalesce((select auth.uid()), new.updated_by);
  else
    new.updated_by := coalesce((select auth.uid()), new.updated_by);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_organizations_master_audit on public.organizations;
create trigger trg_organizations_master_audit
before insert or update on public.organizations
for each row execute function private.set_master_audit_fields();

drop trigger if exists trg_programs_master_audit on public.programs;
create trigger trg_programs_master_audit
before insert or update on public.programs
for each row execute function private.set_master_audit_fields();

drop trigger if exists trg_courses_master_audit on public.courses;
create trigger trg_courses_master_audit
before insert or update on public.courses
for each row execute function private.set_master_audit_fields();

-- Prevent scoped records from being moved outside Leader scope.
create or replace function private.guard_leader_parent_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_active_leader() then
    return new;
  end if;

  if tg_table_name = 'programs'
     and new.organization_id is distinct from old.organization_id
     and not private.leader_can_access_organization(new.organization_id) then
    raise exception 'Program tidak dapat dipindahkan ke universitas di luar scope Leader.'
      using errcode = '42501';
  end if;

  if tg_table_name = 'courses'
     and (
       new.organization_id is distinct from old.organization_id
       or new.program_id is distinct from old.program_id
     )
     and (
       not private.leader_can_access_organization(new.organization_id)
       or not private.leader_can_access_program(new.program_id)
     ) then
    raise exception 'Course tidak dapat dipindahkan ke parent di luar scope Leader.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_programs_guard_leader_parent_scope on public.programs;
create trigger trg_programs_guard_leader_parent_scope
before update on public.programs
for each row execute function private.guard_leader_parent_scope();

drop trigger if exists trg_courses_guard_leader_parent_scope on public.courses;
create trigger trg_courses_guard_leader_parent_scope
before update on public.courses
for each row execute function private.guard_leader_parent_scope();

-- New master data created by Leader automatically becomes their direct scope.
create or replace function private.capture_created_leader_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null or not private.is_active_leader() then
    return new;
  end if;

  if tg_table_name = 'organizations' then
    insert into public.leader_scopes
      (leader_id, organization_id, created_by)
    values (caller, new.id, caller)
    on conflict do nothing;
  elsif tg_table_name = 'programs' then
    insert into public.leader_scopes
      (leader_id, program_id, created_by)
    values (caller, new.id, caller)
    on conflict do nothing;
  elsif tg_table_name = 'courses' then
    insert into public.leader_scopes
      (leader_id, course_id, created_by)
    values (caller, new.id, caller)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_organizations_capture_leader_scope on public.organizations;
create trigger trg_organizations_capture_leader_scope
after insert on public.organizations
for each row execute function private.capture_created_leader_scope();

drop trigger if exists trg_programs_capture_leader_scope on public.programs;
create trigger trg_programs_capture_leader_scope
after insert on public.programs
for each row execute function private.capture_created_leader_scope();

drop trigger if exists trg_courses_capture_leader_scope on public.courses;
create trigger trg_courses_capture_leader_scope
after insert on public.courses
for each row execute function private.capture_created_leader_scope();

-- Leader management table policies.
drop policy if exists leader_scopes_select on public.leader_scopes;
create policy leader_scopes_select
on public.leader_scopes
for select to authenticated
using (
  (select private.is_active_admin())
  or leader_id = (select auth.uid())
);

drop policy if exists leader_scopes_admin_insert on public.leader_scopes;
create policy leader_scopes_admin_insert
on public.leader_scopes
for insert to authenticated
with check ((select private.is_active_admin()));

drop policy if exists leader_scopes_admin_update on public.leader_scopes;
create policy leader_scopes_admin_update
on public.leader_scopes
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

drop policy if exists leader_scopes_admin_delete on public.leader_scopes;
create policy leader_scopes_admin_delete
on public.leader_scopes
for delete to authenticated
using ((select private.is_active_admin()));

drop policy if exists leader_permissions_select on public.leader_permissions;
create policy leader_permissions_select
on public.leader_permissions
for select to authenticated
using (
  (select private.is_active_admin())
  or leader_id = (select auth.uid())
);

drop policy if exists leader_permissions_admin_insert on public.leader_permissions;
create policy leader_permissions_admin_insert
on public.leader_permissions
for insert to authenticated
with check ((select private.is_active_admin()));

drop policy if exists leader_permissions_admin_update on public.leader_permissions;
create policy leader_permissions_admin_update
on public.leader_permissions
for update to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

drop policy if exists leader_permissions_admin_delete on public.leader_permissions;
create policy leader_permissions_admin_delete
on public.leader_permissions
for delete to authenticated
using ((select private.is_active_admin()));

-- Profiles: Leader can read students relevant to scoped Enrollment/Messages.
drop policy if exists "Admins read profiles and users read own profile" on public.profiles;
drop policy if exists profiles_read_authorized on public.profiles;
create policy profiles_read_authorized
on public.profiles
for select to authenticated
using (
  (select private.is_active_admin())
  or id = (select auth.uid())
  or (select private.leader_can_access_profile(id))
);

-- Organizations: preserve broad authenticated read for existing roles, restrict Leader.
drop policy if exists "Authenticated users can select organizations" on public.organizations;
drop policy if exists organizations_authenticated_select on public.organizations;
create policy organizations_authenticated_select
on public.organizations
for select to authenticated
using (
  (select public.current_profile_role()) <> 'leader'::public.profile_role
  or (select private.leader_can_access_organization(id))
);

drop policy if exists "Active admins can insert organizations" on public.organizations;
drop policy if exists organizations_staff_insert on public.organizations;
create policy organizations_staff_insert
on public.organizations
for insert to authenticated
with check (
  (select private.is_active_admin())
  or (select private.leader_has_permission('manage_master_data'))
);

drop policy if exists "Active admins can update organizations" on public.organizations;
drop policy if exists organizations_staff_update on public.organizations;
create policy organizations_staff_update
on public.organizations
for update to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_organization(id))
  )
)
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_organization(id))
  )
);

drop policy if exists "Active admins can delete organizations" on public.organizations;
drop policy if exists organizations_staff_delete on public.organizations;
create policy organizations_staff_delete
on public.organizations
for delete to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_organization(id))
  )
);

-- Programs.
drop policy if exists programs_authenticated_select on public.programs;
create policy programs_authenticated_select
on public.programs
for select to authenticated
using (
  (select private.is_active_admin())
  or (
    (select public.current_profile_role()) = 'leader'::public.profile_role
    and (select private.leader_can_access_program(id))
  )
  or (
    (select public.current_profile_role()) <> 'leader'::public.profile_role
    and status = 'active'::public.program_status
  )
);

drop policy if exists programs_admin_insert on public.programs;
drop policy if exists programs_staff_insert on public.programs;
create policy programs_staff_insert
on public.programs
for insert to authenticated
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_organization(organization_id))
  )
);

drop policy if exists programs_admin_update on public.programs;
drop policy if exists programs_staff_update on public.programs;
create policy programs_staff_update
on public.programs
for update to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_program(id))
  )
)
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_program(id))
  )
);

drop policy if exists programs_admin_delete on public.programs;
drop policy if exists programs_staff_delete on public.programs;
create policy programs_staff_delete
on public.programs
for delete to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_program(id))
  )
);

-- Courses.
drop policy if exists "Authenticated users can select courses" on public.courses;
drop policy if exists courses_authenticated_select on public.courses;
create policy courses_authenticated_select
on public.courses
for select to authenticated
using (
  (select public.current_profile_role()) <> 'leader'::public.profile_role
  or (select private.leader_can_access_course(id))
);

drop policy if exists "Active admins can insert courses" on public.courses;
drop policy if exists courses_staff_insert on public.courses;
create policy courses_staff_insert
on public.courses
for insert to authenticated
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_organization(organization_id))
    and (select private.leader_can_access_program(program_id))
  )
);

drop policy if exists "Active admins can update courses" on public.courses;
drop policy if exists courses_staff_update on public.courses;
create policy courses_staff_update
on public.courses
for update to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_course(id))
  )
)
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_course(id))
  )
);

drop policy if exists "Active admins can delete courses" on public.courses;
drop policy if exists courses_staff_delete on public.courses;
create policy courses_staff_delete
on public.courses
for delete to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and (select private.leader_can_access_course(id))
  )
);

-- Course creation dependency: Leader may read active payment accounts, never write them.
drop policy if exists payment_accounts_select_authorized on public.payment_accounts;
create policy payment_accounts_select_authorized
on public.payment_accounts
for select to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_master_data'))
    and is_active = true
  )
  or (
    (select private.is_active_student())
    and is_active
    and exists (
      select 1
      from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.profile_id = (select auth.uid())
        and c.payment_account_id = payment_accounts.id
        and (
          (e.payment_timing = 'upfront'::public.payment_timing
           and e.status = any(array[
             'pending_payment'::public.enrollment_status,
             'pending_approval'::public.enrollment_status
           ]))
          or
          (e.payment_timing = 'deferred'::public.payment_timing
           and e.status = 'active'::public.enrollment_status)
        )
    )
  )
);

-- Enrollment scoped management.
drop policy if exists "Admins and students read enrollments" on public.enrollments;
drop policy if exists enrollments_read_authorized on public.enrollments;
create policy enrollments_read_authorized
on public.enrollments
for select to authenticated
using (
  (select private.is_active_admin())
  or profile_id = (select auth.uid())
  or (
    (select private.leader_has_permission('manage_enrollment'))
    and (select private.leader_can_access_course(course_id))
  )
);

drop policy if exists enrollments_staff_insert on public.enrollments;
create policy enrollments_staff_insert
on public.enrollments
for insert to authenticated
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_enrollment'))
    and (select private.leader_can_access_course(course_id))
  )
);

drop policy if exists enrollments_update_authorized on public.enrollments;
create policy enrollments_update_authorized
on public.enrollments
for update to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_enrollment'))
    and (select private.leader_can_access_course(course_id))
  )
  or (
    profile_id = (select auth.uid())
    and (select private.is_active_student())
    and status = any(array[
      'pending_payment'::public.enrollment_status,
      'pending_approval'::public.enrollment_status
    ])
  )
)
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_enrollment'))
    and (select private.leader_can_access_course(course_id))
  )
  or (
    profile_id = (select auth.uid())
    and (select private.is_active_student())
    and status = 'pending_approval'::public.enrollment_status
    and activated_at is null
    and expired_at is null
  )
);

drop policy if exists enrollments_admin_delete on public.enrollments;
drop policy if exists enrollments_staff_delete on public.enrollments;
create policy enrollments_staff_delete
on public.enrollments
for delete to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_enrollment'))
    and (select private.leader_can_access_course(course_id))
  )
);

-- Payment is read-only for Leaders when needed to understand scoped enrollment.
drop policy if exists "Admins and students read payments" on public.payments;
drop policy if exists payments_read_authorized on public.payments;
create policy payments_read_authorized
on public.payments
for select to authenticated
using (
  (select private.is_active_admin())
  or exists (
    select 1
    from public.enrollments e
    where e.id = payments.enrollment_id
      and e.profile_id = (select auth.uid())
  )
  or (select private.leader_can_manage_enrollment(enrollment_id))
);

-- Leader may read lesson metadata for scoped message context, but cannot manage lessons.
drop policy if exists lessons_authorized_select on public.lessons;
create policy lessons_authorized_select
on public.lessons
for select to authenticated
using (
  private.can_manage_course(course_id)
  or (
    publication_status = 'published'
    and private.has_active_course_access(course_id)
  )
  or (
    (select private.leader_has_permission('manage_messages'))
    and (select private.leader_can_access_course(course_id))
  )
);

-- Messages.
drop policy if exists lesson_message_threads_select on public.lesson_message_threads;
create policy lesson_message_threads_select
on public.lesson_message_threads
for select to authenticated
using (
  student_profile_id = (select auth.uid())
  or (select public.current_profile_role()) = 'admin'::public.profile_role
  or (
    (select public.current_profile_role()) = 'leader'::public.profile_role
    and (select private.leader_can_manage_course_for(course_id, 'manage_messages'))
  )
  or (
    (select public.current_profile_role()) = 'mentor'::public.profile_role
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
);

drop policy if exists lesson_message_threads_admin_update on public.lesson_message_threads;
drop policy if exists lesson_message_threads_staff_update on public.lesson_message_threads;
create policy lesson_message_threads_staff_update
on public.lesson_message_threads
for update to authenticated
using (
  (select public.current_profile_role()) = 'admin'::public.profile_role
  or (
    (select public.current_profile_role()) = 'leader'::public.profile_role
    and (select private.leader_can_manage_course_for(course_id, 'manage_messages'))
  )
)
with check (
  (select public.current_profile_role()) = 'admin'::public.profile_role
  or (
    (select public.current_profile_role()) = 'leader'::public.profile_role
    and (select private.leader_can_manage_course_for(course_id, 'manage_messages'))
  )
);

drop policy if exists lesson_message_entries_select on public.lesson_message_entries;
create policy lesson_message_entries_select
on public.lesson_message_entries
for select to authenticated
using (
  exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_entries.thread_id
      and (
        t.student_profile_id = (select auth.uid())
        or (select public.current_profile_role()) = 'admin'::public.profile_role
        or (
          (select public.current_profile_role()) = 'leader'::public.profile_role
          and (select private.leader_can_manage_course_for(t.course_id, 'manage_messages'))
        )
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

drop policy if exists lesson_message_entries_insert on public.lesson_message_entries;
create policy lesson_message_entries_insert
on public.lesson_message_entries
for insert to authenticated
with check (
  sender_profile_id = (select auth.uid())
  and sender_role = (select public.current_profile_role())
  and sender_role = any(array[
    'student'::public.profile_role,
    'mentor'::public.profile_role,
    'leader'::public.profile_role,
    'admin'::public.profile_role
  ])
  and exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_entries.thread_id
      and (
        (sender_role = 'student'::public.profile_role
         and t.student_profile_id = (select auth.uid()))
        or sender_role = 'admin'::public.profile_role
        or (
          sender_role = 'leader'::public.profile_role
          and t.status <> 'closed'
          and (select private.leader_can_manage_course_for(t.course_id, 'manage_messages'))
        )
        or (
          sender_role = 'mentor'::public.profile_role
          and t.status <> 'closed'
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

drop policy if exists lesson_message_thread_reads_insert on public.lesson_message_thread_reads;
create policy lesson_message_thread_reads_insert
on public.lesson_message_thread_reads
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_thread_reads.thread_id
      and (
        t.student_profile_id = (select auth.uid())
        or (select public.current_profile_role()) = 'admin'::public.profile_role
        or (
          (select public.current_profile_role()) = 'leader'::public.profile_role
          and (select private.leader_can_manage_course_for(t.course_id, 'manage_messages'))
        )
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

drop policy if exists lesson_message_thread_reads_update on public.lesson_message_thread_reads;
create policy lesson_message_thread_reads_update
on public.lesson_message_thread_reads
for update to authenticated
using (profile_id = (select auth.uid()))
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_thread_reads.thread_id
      and (
        t.student_profile_id = (select auth.uid())
        or (select public.current_profile_role()) = 'admin'::public.profile_role
        or (
          (select public.current_profile_role()) = 'leader'::public.profile_role
          and (select private.leader_can_manage_course_for(t.course_id, 'manage_messages'))
        )
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

-- Participant summaries include scoped Leaders.
create or replace function public.get_message_participant_summaries(
  target_profile_ids uuid[]
)
returns table (
  id uuid,
  full_name text,
  university_origin text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_role public.profile_role := (select public.current_profile_role());
begin
  if caller_role = 'admin'::public.profile_role then
    return query
    select p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(target_profile_ids);
    return;
  end if;

  if caller_role = 'leader'::public.profile_role then
    return query
    select distinct p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(target_profile_ids)
      and exists (
        select 1
        from public.lesson_message_threads t
        left join public.lesson_message_entries e on e.thread_id = t.id
        where private.leader_can_manage_course_for(t.course_id, 'manage_messages')
          and (
            t.student_profile_id = p.id
            or e.sender_profile_id = p.id
          )
      );
    return;
  end if;

  if caller_role = 'mentor'::public.profile_role then
    return query
    select distinct p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(target_profile_ids)
      and exists (
        select 1
        from public.lesson_message_threads t
        left join public.lesson_message_entries e on e.thread_id = t.id
        where public.is_assigned_mentor((select auth.uid()), t.course_id)
          and (
            t.student_profile_id = p.id
            or e.sender_profile_id = p.id
          )
      );
    return;
  end if;

  if caller_role = 'student'::public.profile_role then
    return query
    select distinct p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(target_profile_ids)
      and exists (
        select 1
        from public.lesson_message_threads t
        join public.lesson_message_entries e on e.thread_id = t.id
        where t.student_profile_id = (select auth.uid())
          and e.sender_profile_id = p.id
      );
    return;
  end if;

  raise exception 'Akses percakapan diperlukan.';
end;
$$;

revoke all on function public.get_message_participant_summaries(uuid[]) from public;
grant execute on function public.get_message_participant_summaries(uuid[]) to authenticated;

-- Announcements: Leaders see scoped announcements; only manage their own scoped announcements.
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
          select 1 from public.announcement_organizations ao
          where ao.announcement_id = announcements.id
        )
        and not exists (
          select 1 from public.announcement_courses ac
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
      all_students = true
      or exists (
        select 1
        from public.announcement_courses ac
        join public.enrollments e on e.course_id = ac.course_id
        where ac.announcement_id = announcements.id
          and e.profile_id = (select auth.uid())
          and e.status = 'active'::public.enrollment_status
          and (e.expired_at is null or e.expired_at > now())
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
      )
    )
  )
);

drop policy if exists announcements_admin_insert on public.announcements;
drop policy if exists announcements_staff_insert on public.announcements;
create policy announcements_staff_insert
on public.announcements
for insert to authenticated
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and created_by = (select auth.uid())
    and all_students = false
  )
);

drop policy if exists announcements_admin_update on public.announcements;
drop policy if exists announcements_staff_update on public.announcements;
create policy announcements_staff_update
on public.announcements
for update to authenticated
using (
  (select private.is_active_admin())
  or (
    created_by = (select auth.uid())
    and (select private.leader_can_manage_announcement(id))
  )
)
with check (
  (select private.is_active_admin())
  or (
    created_by = (select auth.uid())
    and all_students = false
    and (select private.leader_can_manage_announcement(id))
  )
);

drop policy if exists announcements_admin_delete on public.announcements;
drop policy if exists announcements_staff_delete on public.announcements;
create policy announcements_staff_delete
on public.announcements
for delete to authenticated
using (
  (select private.is_active_admin())
  or (
    created_by = (select auth.uid())
    and (select private.leader_can_manage_announcement(id))
  )
);

drop policy if exists announcement_organizations_admin_insert on public.announcement_organizations;
drop policy if exists announcement_organizations_staff_insert on public.announcement_organizations;
create policy announcement_organizations_staff_insert
on public.announcement_organizations
for insert to authenticated
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and (select private.leader_can_access_organization(organization_id))
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_organizations.announcement_id
        and a.created_by = (select auth.uid())
        and a.all_students = false
    )
  )
);

drop policy if exists announcement_organizations_admin_update on public.announcement_organizations;
drop policy if exists announcement_organizations_staff_update on public.announcement_organizations;
create policy announcement_organizations_staff_update
on public.announcement_organizations
for update to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and (select private.leader_can_access_organization(organization_id))
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_organizations.announcement_id
        and a.created_by = (select auth.uid())
    )
  )
)
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and (select private.leader_can_access_organization(organization_id))
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_organizations.announcement_id
        and a.created_by = (select auth.uid())
        and a.all_students = false
    )
  )
);

drop policy if exists announcement_organizations_admin_delete on public.announcement_organizations;
drop policy if exists announcement_organizations_staff_delete on public.announcement_organizations;
create policy announcement_organizations_staff_delete
on public.announcement_organizations
for delete to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and (select private.leader_can_access_organization(organization_id))
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_organizations.announcement_id
        and a.created_by = (select auth.uid())
    )
  )
);

drop policy if exists announcement_courses_admin_insert on public.announcement_courses;
drop policy if exists announcement_courses_staff_insert on public.announcement_courses;
create policy announcement_courses_staff_insert
on public.announcement_courses
for insert to authenticated
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and (select private.leader_can_access_course(course_id))
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_courses.announcement_id
        and a.created_by = (select auth.uid())
        and a.all_students = false
    )
  )
);

drop policy if exists announcement_courses_admin_update on public.announcement_courses;
drop policy if exists announcement_courses_staff_update on public.announcement_courses;
create policy announcement_courses_staff_update
on public.announcement_courses
for update to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and (select private.leader_can_access_course(course_id))
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_courses.announcement_id
        and a.created_by = (select auth.uid())
    )
  )
)
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and (select private.leader_can_access_course(course_id))
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_courses.announcement_id
        and a.created_by = (select auth.uid())
        and a.all_students = false
    )
  )
);

drop policy if exists announcement_courses_admin_delete on public.announcement_courses;
drop policy if exists announcement_courses_staff_delete on public.announcement_courses;
create policy announcement_courses_staff_delete
on public.announcement_courses
for delete to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_announcements'))
    and (select private.leader_can_access_course(course_id))
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_courses.announcement_id
        and a.created_by = (select auth.uid())
    )
  )
);
