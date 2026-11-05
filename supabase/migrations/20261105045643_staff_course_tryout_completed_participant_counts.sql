-- A single indexed aggregate per course; no participant records leave Postgres.
-- The number counts unique profiles with at least one submitted attempt.
-- Active/draft work and repeated submissions are not counted twice.
create function public.get_staff_course_tryout_cards(p_course_id uuid)
returns table (
  id uuid,
  title text,
  publication_status text,
  duration_minutes integer,
  max_attempts integer,
  created_by uuid,
  completed_participants bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null
     or not (
       private.is_active_admin()
       or private.leader_can_access_course(p_course_id)
       or (
         public.current_profile_role() = 'mentor'::public.profile_role
         and public.is_assigned_mentor((select auth.uid()), p_course_id)
       )
     )
  then
    raise exception 'Tidak memiliki akses ke data Try Out course ini.'
      using errcode = '42501';
  end if;

  return query
  select
    t.id,
    t.title::text,
    t.publication_status,
    t.duration_minutes,
    t.max_attempts,
    t.created_by,
    count(distinct a.profile_id) as completed_participants
  from public.tryouts t
  left join public.tryout_attempts a
    on a.tryout_id = t.id
   and a.status = 'submitted'
  where t.course_id = p_course_id
  group by t.id
  order by t.created_at desc;
end;
$function$;

revoke all on function public.get_staff_course_tryout_cards(uuid) from public, anon, authenticated;
grant execute on function public.get_staff_course_tryout_cards(uuid) to authenticated;
comment on function public.get_staff_course_tryout_cards(uuid) is
  'Staff-only course Try Out metadata with unique submitted-participant counts; no participant records exposed.';
