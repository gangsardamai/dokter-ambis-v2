create or replace function private.is_assigned_course_mentor(target_course_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.course_mentors as cm
    join public.mentor_details as md on md.id = cm.mentor_id
    join public.profiles as p on p.id = md.profile_id
    where cm.course_id = target_course_id
      and cm.is_active
      and md.profile_id = (select auth.uid())
      and p.role = 'mentor'
      and p.status = 'active'
  );
$function$;
