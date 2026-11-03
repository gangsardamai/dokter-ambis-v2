-- Reviews are anonymous to mentors, admins and scoped leaders in RPC responses.
-- Reviewer identity remains stored privately for uniqueness and self-edits.

CREATE OR REPLACE FUNCTION public.admin_get_mentor_detail(target_profile_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
          'reviewerName', case when mr.reviewer_type = 'admin' then 'Admin' else 'Peserta Anonim' end,
          'reviewerType', mr.reviewer_type,
          'rating', mr.rating,
          'suggestion', mr.suggestion,
          'updatedAt', (mr.updated_at AT TIME ZONE 'Asia/Jakarta')::date
        )
        order by mr.updated_at desc
      )
      from public.mentor_reviews mr
      join public.courses c on c.id = mr.course_id
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
$function$;

CREATE OR REPLACE FUNCTION public.mentor_get_course_reviews(target_course_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
declare current_id uuid:=auth.uid(); target_mentor_id uuid; result jsonb;
begin
  select md.id into target_mentor_id from public.mentor_details md join public.profiles p on p.id=md.profile_id
  where md.profile_id=current_id and p.role='mentor' and p.status='active';
  if target_mentor_id is null then raise exception 'Mentor aktif tidak ditemukan.' using errcode='42501'; end if;
  if not exists(select 1 from public.course_mentors where mentor_id=target_mentor_id and course_id=target_course_id) then raise exception 'Course tidak ditemukan pada riwayat penugasan.' using errcode='42501'; end if;

  select jsonb_build_object(
    'courseId',c.id,'courseTitle',c.title,
    'averageRating',coalesce((select round(avg(rating)::numeric,2) from public.mentor_reviews where mentor_id=target_mentor_id and course_id=c.id),0),
    'ratingCount',(select count(*) from public.mentor_reviews where mentor_id=target_mentor_id and course_id=c.id),
    'reviews',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',mr.id,'reviewerName',case when mr.reviewer_type='admin' then 'Admin' else 'Peserta Anonim' end,
        'reviewerType',mr.reviewer_type,'rating',mr.rating,'suggestion',mr.suggestion,'updatedAt', (mr.updated_at AT TIME ZONE 'Asia/Jakarta')::date
      ) order by mr.updated_at desc)
      from public.mentor_reviews mr
      where mr.mentor_id=target_mentor_id and mr.course_id=c.id
    ),'[]'::jsonb)
  ) into result from public.courses c where c.id=target_course_id;
  return result;
end;
$function$;

-- Prevent direct access to reviewer_profile_id via the Data API.
-- App reviews are saved and read through restricted SECURITY DEFINER RPCs.
REVOKE SELECT ON TABLE public.mentor_reviews FROM authenticated;
