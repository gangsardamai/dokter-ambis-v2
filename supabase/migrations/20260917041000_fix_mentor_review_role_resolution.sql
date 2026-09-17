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

  select p.role
  into v_profile_role
  from public.profiles p
  where p.id = v_profile_id
    and p.status = 'active';

  if v_profile_role is null or v_profile_role not in ('admin'::public.profile_role, 'student'::public.profile_role) then
    raise exception 'Anda tidak dapat memberikan penilaian.' using errcode='42501';
  end if;

  if not exists (
    select 1
    from public.courses c
    where c.id = target_course_id
      and c.mentor_rating_enabled
  ) then
    raise exception 'Penilaian mentor sedang dinonaktifkan.';
  end if;

  if not exists (
    select 1
    from public.course_mentors cm
    where cm.course_id = target_course_id
      and cm.mentor_id = target_mentor_id
      and cm.is_active
  ) then
    raise exception 'Mentor tidak sedang ditugaskan pada course ini.';
  end if;

  if v_profile_role = 'student'::public.profile_role and not exists (
    select 1
    from public.enrollments e
    where e.profile_id = v_profile_id
      and e.course_id = target_course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  ) then
    raise exception 'Enrollment aktif diperlukan untuk menilai mentor.' using errcode='42501';
  end if;

  insert into public.mentor_reviews(
    mentor_id,
    course_id,
    reviewer_profile_id,
    reviewer_type,
    rating,
    suggestion
  )
  values(
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
