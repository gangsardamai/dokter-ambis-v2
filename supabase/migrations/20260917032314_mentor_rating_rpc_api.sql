create or replace function public.admin_get_mentor_directory()
returns jsonb
language plpgsql
stable security definer
set search_path = 'public', 'auth', 'private', 'pg_temp'
as $function$
declare result jsonb;
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.' using errcode='42501';
  end if;

  select jsonb_build_object(
    'mentors', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'profileId', p.id,
          'mentorId', md.id,
          'fullName', p.full_name,
          'email', coalesce(u.email, ''),
          'status', p.status,
          'averageRating', coalesce(stats.avg_rating, 0),
          'ratingCount', coalesce(stats.rating_count, 0),
          'courses', coalesce(assignments.courses, '[]'::jsonb)
        ) order by p.full_name
      )
      from public.mentor_details md
      join public.profiles p on p.id=md.profile_id and p.role='mentor'
      join auth.users u on u.id=p.id
      left join lateral (
        select round(avg(mr.rating)::numeric,2) avg_rating, count(*) rating_count
        from public.mentor_reviews mr where mr.mentor_id=md.id
      ) stats on true
      left join lateral (
        select jsonb_agg(jsonb_build_object(
          'id', c.id, 'title', c.title,
          'organizationId', o.id, 'organizationTitle', o.title, 'organizationShortName', o.short_name,
          'programId', pr.id, 'programTitle', pr.title,
          'isActive', cm.is_active, 'assignedAt', cm.created_at, 'removedAt', cm.removed_at
        ) order by cm.is_active desc, o.title, c.title) courses
        from public.course_mentors cm
        join public.courses c on c.id=cm.course_id
        join public.organizations o on o.id=c.organization_id
        join public.programs pr on pr.id=c.program_id
        where cm.mentor_id=md.id
      ) assignments on true
    ), '[]'::jsonb),
    'courses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'title', c.title,
        'organizationId', o.id, 'organizationTitle', o.title, 'organizationShortName', o.short_name,
        'programId', pr.id, 'programTitle', pr.title
      ) order by o.title, pr.title, c.title)
      from public.courses c
      join public.organizations o on o.id=c.organization_id
      join public.programs pr on pr.id=c.program_id
    ), '[]'::jsonb),
    'organizations', coalesce((
      select jsonb_agg(jsonb_build_object('id',o.id,'title',o.title,'shortName',o.short_name) order by o.title)
      from public.organizations o
    ), '[]'::jsonb),
    'programs', coalesce((
      select jsonb_agg(jsonb_build_object('id',pr.id,'title',pr.title,'organizationId',pr.organization_id) order by pr.title)
      from public.programs pr
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$function$;

create or replace function public.admin_get_mentor_detail(target_profile_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path = 'public','auth','private','pg_temp'
as $function$
declare result jsonb;
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.' using errcode='42501';
  end if;

  select jsonb_build_object(
    'profileId', p.id, 'mentorId', md.id, 'fullName', p.full_name, 'email', coalesce(u.email,''),
    'status', p.status,
    'averageRating', coalesce((select round(avg(rating)::numeric,2) from public.mentor_reviews where mentor_id=md.id),0),
    'ratingCount', (select count(*) from public.mentor_reviews where mentor_id=md.id),
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'courseId',c.id,'courseTitle',c.title,'organizationTitle',o.title,'programTitle',pr.title,
        'isActive',cm.is_active,'assignedAt',cm.created_at,'removedAt',cm.removed_at,
        'averageRating',coalesce(rs.avg_rating,0),'ratingCount',coalesce(rs.rating_count,0)
      ) order by cm.is_active desc, o.title, c.title)
      from public.course_mentors cm
      join public.courses c on c.id=cm.course_id
      join public.organizations o on o.id=c.organization_id
      join public.programs pr on pr.id=c.program_id
      left join lateral (
        select round(avg(mr.rating)::numeric,2) avg_rating, count(*) rating_count
        from public.mentor_reviews mr where mr.mentor_id=md.id and mr.course_id=c.id
      ) rs on true
      where cm.mentor_id=md.id
    ),'[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',mr.id,'courseId',c.id,'courseTitle',c.title,
        'reviewerName',case when mr.reviewer_type='admin' then 'Admin' else rp.full_name end,
        'reviewerType',mr.reviewer_type,'rating',mr.rating,'suggestion',mr.suggestion,'updatedAt',mr.updated_at
      ) order by mr.updated_at desc)
      from public.mentor_reviews mr
      join public.courses c on c.id=mr.course_id
      join public.profiles rp on rp.id=mr.reviewer_profile_id
      where mr.mentor_id=md.id
    ),'[]'::jsonb)
  ) into result
  from public.mentor_details md
  join public.profiles p on p.id=md.profile_id
  join auth.users u on u.id=p.id
  where p.id=target_profile_id and p.role='mentor';

  return result;
end;
$function$;

create or replace function public.admin_set_mentor_assignment(target_profile_id uuid, target_course_id uuid, target_active boolean)
returns void
language plpgsql
security definer
set search_path='public','private','pg_temp'
as $function$
declare target_mentor_id uuid;
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.' using errcode='42501';
  end if;
  select md.id into target_mentor_id
  from public.mentor_details md join public.profiles p on p.id=md.profile_id
  where md.profile_id=target_profile_id and p.role='mentor';
  if target_mentor_id is null then raise exception 'Mentor tidak ditemukan.'; end if;
  if not exists(select 1 from public.courses where id=target_course_id) then raise exception 'Course tidak ditemukan.'; end if;

  if target_active then
    insert into public.course_mentors(course_id,mentor_id,is_active,removed_at)
    values(target_course_id,target_mentor_id,true,null)
    on conflict(course_id,mentor_id) do update set is_active=true, removed_at=null;
  else
    update public.course_mentors set is_active=false, removed_at=now()
    where course_id=target_course_id and mentor_id=target_mentor_id;
  end if;
end;
$function$;

create or replace function public.admin_set_mentor_rating_enabled(target_course_id uuid, target_enabled boolean)
returns void
language plpgsql
security definer
set search_path='public','private','pg_temp'
as $function$
begin
  if not private.is_active_admin() then raise exception 'Anda tidak memiliki izin sebagai admin.' using errcode='42501'; end if;
  update public.courses set mentor_rating_enabled=target_enabled where id=target_course_id;
  if not found then raise exception 'Course tidak ditemukan.'; end if;
end;
$function$;

create or replace function public.get_course_mentor_rating_context(target_course_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path='public','private','pg_temp'
as $function$
declare current_id uuid := auth.uid(); result jsonb;
begin
  if current_id is null then raise exception 'Silakan masuk terlebih dahulu.' using errcode='42501'; end if;
  if not private.is_active_admin() and not exists(
    select 1 from public.enrollments e where e.profile_id=current_id and e.course_id=target_course_id and e.status='active'
  ) then
    raise exception 'Anda tidak memiliki akses ke course ini.' using errcode='42501';
  end if;

  select jsonb_build_object(
    'enabled',c.mentor_rating_enabled,
    'mentors',coalesce((
      select jsonb_agg(jsonb_build_object(
        'mentorId',md.id,'profileId',p.id,'fullName',p.full_name,
        'rating',mr.rating,'suggestion',mr.suggestion
      ) order by p.full_name)
      from public.course_mentors cm
      join public.mentor_details md on md.id=cm.mentor_id
      join public.profiles p on p.id=md.profile_id
      left join public.mentor_reviews mr on mr.mentor_id=md.id and mr.course_id=target_course_id and mr.reviewer_profile_id=current_id
      where cm.course_id=target_course_id and cm.is_active and p.status='active'
    ),'[]'::jsonb)
  ) into result
  from public.courses c where c.id=target_course_id;
  return result;
end;
$function$;

create or replace function public.save_mentor_review(target_course_id uuid, target_mentor_id uuid, target_rating integer, target_suggestion text default null)
returns void
language plpgsql
security definer
set search_path='public','private','pg_temp'
as $function$
declare current_id uuid := auth.uid(); current_role public.profile_role;
begin
  if target_rating < 1 or target_rating > 5 then raise exception 'Nilai bintang harus 1 sampai 5.'; end if;
  if target_suggestion is not null and char_length(target_suggestion) > 500 then raise exception 'Saran maksimal 500 karakter.'; end if;
  select role into current_role from public.profiles where id=current_id and status='active';
  if current_role not in ('admin','student') then raise exception 'Anda tidak dapat memberikan penilaian.' using errcode='42501'; end if;
  if not exists(select 1 from public.courses where id=target_course_id and mentor_rating_enabled) then raise exception 'Penilaian mentor sedang dinonaktifkan.'; end if;
  if not exists(select 1 from public.course_mentors where course_id=target_course_id and mentor_id=target_mentor_id and is_active) then raise exception 'Mentor tidak sedang ditugaskan pada course ini.'; end if;
  if current_role='student' and not exists(select 1 from public.enrollments where profile_id=current_id and course_id=target_course_id and status='active') then
    raise exception 'Enrollment aktif diperlukan untuk menilai mentor.' using errcode='42501';
  end if;

  insert into public.mentor_reviews(mentor_id,course_id,reviewer_profile_id,reviewer_type,rating,suggestion)
  values(target_mentor_id,target_course_id,current_id,case when current_role='admin' then 'admin' else 'student' end,target_rating,nullif(trim(coalesce(target_suggestion,'')),''))
  on conflict(mentor_id,course_id,reviewer_profile_id)
  do update set rating=excluded.rating,suggestion=excluded.suggestion,reviewer_type=excluded.reviewer_type,updated_at=now();
end;
$function$;

create or replace function public.mentor_get_rating_dashboard()
returns jsonb
language plpgsql
stable security definer
set search_path='public','private','pg_temp'
as $function$
declare current_id uuid:=auth.uid(); target_mentor_id uuid; result jsonb;
begin
  select md.id into target_mentor_id from public.mentor_details md join public.profiles p on p.id=md.profile_id
  where md.profile_id=current_id and p.role='mentor' and p.status='active';
  if target_mentor_id is null then raise exception 'Mentor aktif tidak ditemukan.' using errcode='42501'; end if;

  select jsonb_build_object(
    'overallAverage',coalesce((select round(avg(rating)::numeric,2) from public.mentor_reviews where mentor_id=target_mentor_id),0),
    'totalRatings',(select count(*) from public.mentor_reviews where mentor_id=target_mentor_id),
    'courses',coalesce((
      select jsonb_agg(jsonb_build_object(
        'courseId',c.id,'courseTitle',c.title,'organizationTitle',o.title,'programTitle',pr.title,
        'isActive',cm.is_active,'averageRating',coalesce(rs.avg_rating,0),'ratingCount',coalesce(rs.rating_count,0)
      ) order by cm.is_active desc,o.title,c.title)
      from public.course_mentors cm
      join public.courses c on c.id=cm.course_id
      join public.organizations o on o.id=c.organization_id
      join public.programs pr on pr.id=c.program_id
      left join lateral(select round(avg(rating)::numeric,2) avg_rating,count(*) rating_count from public.mentor_reviews where mentor_id=target_mentor_id and course_id=c.id) rs on true
      where cm.mentor_id=target_mentor_id
    ),'[]'::jsonb)
  ) into result;
  return result;
end;
$function$;

create or replace function public.mentor_get_course_reviews(target_course_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path='public','private','pg_temp'
as $function$
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
        'id',mr.id,'reviewerName',case when mr.reviewer_type='admin' then 'Admin' else p.full_name end,
        'reviewerType',mr.reviewer_type,'rating',mr.rating,'suggestion',mr.suggestion,'updatedAt',mr.updated_at
      ) order by mr.updated_at desc)
      from public.mentor_reviews mr join public.profiles p on p.id=mr.reviewer_profile_id
      where mr.mentor_id=target_mentor_id and mr.course_id=c.id
    ),'[]'::jsonb)
  ) into result from public.courses c where c.id=target_course_id;
  return result;
end;
$function$;

grant execute on function public.admin_get_mentor_directory() to authenticated;
grant execute on function public.admin_get_mentor_detail(uuid) to authenticated;
grant execute on function public.admin_set_mentor_assignment(uuid,uuid,boolean) to authenticated;
grant execute on function public.admin_set_mentor_rating_enabled(uuid,boolean) to authenticated;
grant execute on function public.get_course_mentor_rating_context(uuid) to authenticated;
grant execute on function public.save_mentor_review(uuid,uuid,integer,text) to authenticated;
grant execute on function public.mentor_get_rating_dashboard() to authenticated;
grant execute on function public.mentor_get_course_reviews(uuid) to authenticated;
