-- Give active Leaders manager-level access to course content only inside their assigned scope.
-- This central helper is already used by folder/lesson/file/video/quiz RLS and management RPCs.

create or replace function private.can_manage_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_active_admin()
    or private.is_assigned_course_mentor(target_course_id)
    or (
      private.is_active_leader()
      and private.leader_can_access_course(target_course_id)
    );
$$;

revoke all on function private.can_manage_course(uuid) from public;
