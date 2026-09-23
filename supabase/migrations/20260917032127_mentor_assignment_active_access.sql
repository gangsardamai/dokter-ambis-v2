create or replace function public.is_assigned_mentor(target_profile_id uuid, target_course_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.mentor_details md
    join public.course_mentors cm on cm.mentor_id = md.id
    join public.profiles p on p.id = md.profile_id
    where md.profile_id = target_profile_id
      and cm.course_id = target_course_id
      and cm.is_active
      and p.role = 'mentor'::public.profile_role
      and p.status = 'active'::public.profile_status
  );
$function$;
