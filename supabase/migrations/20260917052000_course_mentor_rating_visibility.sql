alter table public.course_mentors
  add column if not exists show_in_rating boolean not null default true;

create or replace function public.admin_get_mentor_directory()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'auth', 'private', 'pg_temp'
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
          'isActive', cm.is_active, 'showInRating', cm.show_in_rating,
          'assignedAt', cm.created_at, 'removedAt', cm.removed_at
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

create or replace function public.get_course_mentor_rating_context(target_course_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'private', 'pg_temp'
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
      where cm.course_id=target_course_id
        and cm.is_active
        and cm.show_in_rating
        and p.status='active'
    ),'[]'::jsonb)
  ) into result
  from public.courses c where c.id=target_course_id;
  return result;
end;
$function$;

create or replace function public.save_mentor_review(
  target_course_id uuid,
  target_mentor_id uuid,
  target_rating integer,
  target_suggestion text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $function$
declare
  v_profile_id uuid := auth.uid();
  v_profile_role public.profile_role;
begin
  if v_profile_id is null then
    raise exception 'Silakan masuk terlebih dahulu.' using errcode='42501';
  end if;

  if target_rating < 1 or target_rating > 5 then
    raise exception 'Nilai bintang harus 1 sampai 5.';
  end if;

  if target_suggestion is not null and char_length(target_suggestion) > 500 then
    raise exception 'Saran maksimal 500 karakter.';
  end if;

  select p.role into v_profile_role
  from public.profiles p
  where p.id = v_profile_id and p.status = 'active';

  if v_profile_role is null or v_profile_role not in ('admin'::public.profile_role, 'student'::public.profile_role) then
    raise exception 'Anda tidak dapat memberikan penilaian.' using errcode='42501';
  end if;

  if not exists (
    select 1 from public.courses c
    where c.id = target_course_id and c.mentor_rating_enabled
  ) then
    raise exception 'Penilaian mentor sedang dinonaktifkan.';
  end if;

  if not exists (
    select 1 from public.course_mentors cm
    where cm.course_id = target_course_id
      and cm.mentor_id = target_mentor_id
      and cm.is_active
      and cm.show_in_rating
  ) then
    raise exception 'Mentor tidak dipilih untuk penilaian pada course ini.';
  end if;

  if v_profile_role = 'student'::public.profile_role and not exists (
    select 1 from public.enrollments e
    where e.profile_id = v_profile_id
      and e.course_id = target_course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  ) then
    raise exception 'Enrollment aktif diperlukan untuk menilai mentor.' using errcode='42501';
  end if;

  insert into public.mentor_reviews(
    mentor_id, course_id, reviewer_profile_id, reviewer_type, rating, suggestion
  ) values(
    target_mentor_id,
    target_course_id,
    v_profile_id,
    case when v_profile_role = 'admin'::public.profile_role then 'admin' else 'student' end,
    target_rating,
    nullif(trim(coalesce(target_suggestion,'')),'')
  )
  on conflict(mentor_id,course_id,reviewer_profile_id)
  do update set
    rating=excluded.rating,
    suggestion=excluded.suggestion,
    reviewer_type=excluded.reviewer_type,
    updated_at=now();
end;
$function$;

create or replace function public.admin_set_mentor_assignment(
  target_profile_id uuid,
  target_course_id uuid,
  target_active boolean
)
returns void
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $function$
declare target_mentor_id uuid;
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.' using errcode='42501';
  end if;

  select md.id into target_mentor_id
  from public.mentor_details md
  join public.profiles p on p.id=md.profile_id
  where md.profile_id=target_profile_id and p.role='mentor';

  if target_mentor_id is null then raise exception 'Mentor tidak ditemukan.'; end if;
  if not exists(select 1 from public.courses where id=target_course_id) then raise exception 'Course tidak ditemukan.'; end if;

  if target_active then
    insert into public.course_mentors(course_id,mentor_id,is_active,removed_at,show_in_rating)
    values(target_course_id,target_mentor_id,true,null,true)
    on conflict(course_id,mentor_id) do update
      set is_active=true, removed_at=null, show_in_rating=true;
  else
    update public.course_mentors
    set is_active=false, removed_at=now()
    where course_id=target_course_id and mentor_id=target_mentor_id;
  end if;
end;
$function$;

create or replace function public.admin_set_course_rating_mentors(
  target_course_id uuid,
  target_mentor_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $function$
declare
  selected_ids uuid[] := coalesce(target_mentor_ids, '{}'::uuid[]);
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.' using errcode='42501';
  end if;

  if not exists(select 1 from public.courses c where c.id=target_course_id) then
    raise exception 'Course tidak ditemukan.';
  end if;

  if exists (
    select 1
    from unnest(selected_ids) selected(mentor_id)
    where not exists (
      select 1 from public.course_mentors cm
      where cm.course_id=target_course_id
        and cm.mentor_id=selected.mentor_id
        and cm.is_active
    )
  ) then
    raise exception 'Ada mentor yang tidak ditugaskan aktif pada course ini.';
  end if;

  update public.course_mentors cm
  set show_in_rating = cm.mentor_id = any(selected_ids)
  where cm.course_id=target_course_id
    and cm.is_active;
end;
$function$;

revoke all on function public.admin_set_course_rating_mentors(uuid, uuid[]) from public;
grant execute on function public.admin_set_course_rating_mentors(uuid, uuid[]) to authenticated;
