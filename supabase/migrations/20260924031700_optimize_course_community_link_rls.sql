-- Consolidate course_community_links SELECT authorization into one policy
-- to avoid multiple permissive-policy evaluation on every read.

drop policy if exists "course_community_links_admin_select"
on public.course_community_links;

drop policy if exists "course_community_links_student_select"
on public.course_community_links;

create policy "course_community_links_authorized_select"
on public.course_community_links
for select
to authenticated
using (
  (select private.is_active_admin())
  or (
    private.is_active_leader()
    and private.leader_can_access_course(course_community_links.course_id)
  )
  or (
    (select private.is_active_student())
    and exists (
      select 1
      from public.enrollments e
      where e.profile_id = (select auth.uid())
        and e.course_id = course_community_links.course_id
        and e.status = 'active'::public.enrollment_status
    )
  )
);
