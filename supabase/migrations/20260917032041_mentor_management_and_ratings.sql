alter table public.courses
  add column if not exists mentor_rating_enabled boolean not null default false;

alter table public.course_mentors
  add column if not exists is_active boolean not null default true,
  add column if not exists removed_at timestamptz;

create table if not exists public.mentor_reviews (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_details(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  reviewer_profile_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_type text not null check (reviewer_type in ('student','admin')),
  rating smallint not null check (rating between 1 and 5),
  suggestion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentor_reviews_suggestion_length check (suggestion is null or char_length(suggestion) <= 500),
  constraint mentor_reviews_unique_reviewer unique (mentor_id, course_id, reviewer_profile_id)
);

create index if not exists mentor_reviews_mentor_course_idx
  on public.mentor_reviews (mentor_id, course_id);
create index if not exists mentor_reviews_course_idx
  on public.mentor_reviews (course_id);
create index if not exists course_mentors_active_idx
  on public.course_mentors (mentor_id, course_id) where is_active;

drop trigger if exists set_mentor_reviews_updated_at on public.mentor_reviews;
create trigger set_mentor_reviews_updated_at
before update on public.mentor_reviews
for each row execute function public.update_updated_at_column();

alter table public.mentor_reviews enable row level security;

drop policy if exists mentor_reviews_select_authorized on public.mentor_reviews;
create policy mentor_reviews_select_authorized
on public.mentor_reviews
for select
to authenticated
using (
  (select private.is_active_admin())
  or reviewer_profile_id = (select auth.uid())
  or exists (
    select 1
    from public.mentor_details md
    where md.id = mentor_reviews.mentor_id
      and md.profile_id = (select auth.uid())
  )
);

drop policy if exists mentor_reviews_insert_authorized on public.mentor_reviews;
create policy mentor_reviews_insert_authorized
on public.mentor_reviews
for insert
to authenticated
with check (
  reviewer_profile_id = (select auth.uid())
  and exists (
    select 1
    from public.courses c
    join public.course_mentors cm on cm.course_id = c.id
    where c.id = mentor_reviews.course_id
      and cm.mentor_id = mentor_reviews.mentor_id
      and cm.is_active
      and c.mentor_rating_enabled
  )
  and (
    (
      reviewer_type = 'admin'
      and (select private.is_active_admin())
    )
    or (
      reviewer_type = 'student'
      and (select private.is_active_student())
      and exists (
        select 1
        from public.enrollments e
        where e.profile_id = (select auth.uid())
          and e.course_id = mentor_reviews.course_id
          and e.status = 'active'
      )
    )
  )
);

drop policy if exists mentor_reviews_update_authorized on public.mentor_reviews;
create policy mentor_reviews_update_authorized
on public.mentor_reviews
for update
to authenticated
using (reviewer_profile_id = (select auth.uid()))
with check (
  reviewer_profile_id = (select auth.uid())
  and exists (
    select 1
    from public.courses c
    join public.course_mentors cm on cm.course_id = c.id
    where c.id = mentor_reviews.course_id
      and cm.mentor_id = mentor_reviews.mentor_id
      and cm.is_active
      and c.mentor_rating_enabled
  )
  and (
    (
      reviewer_type = 'admin'
      and (select private.is_active_admin())
    )
    or (
      reviewer_type = 'student'
      and (select private.is_active_student())
      and exists (
        select 1
        from public.enrollments e
        where e.profile_id = (select auth.uid())
          and e.course_id = mentor_reviews.course_id
          and e.status = 'active'
      )
    )
  )
);

create or replace function public.set_course_mentors(
  target_course_id uuid,
  target_mentor_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requested_count integer;
  valid_count integer;
begin
  if not private.is_active_admin() then
    raise exception 'Hanya admin aktif yang dapat mengatur mentor course.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.courses where id = target_course_id) then
    raise exception 'Course tidak ditemukan.' using errcode = 'P0002';
  end if;

  select count(distinct mentor_id)::integer
    into requested_count
  from unnest(coalesce(target_mentor_ids, array[]::uuid[])) as requested(mentor_id);

  select count(distinct md.id)::integer
    into valid_count
  from public.mentor_details md
  join public.profiles profile on profile.id = md.profile_id
  where md.id = any(coalesce(target_mentor_ids, array[]::uuid[]))
    and profile.role = 'mentor'
    and profile.status = 'active';

  if requested_count <> valid_count then
    raise exception 'Satu atau lebih mentor tidak valid atau tidak aktif.' using errcode = '22023';
  end if;

  update public.course_mentors
  set is_active = false,
      removed_at = now()
  where course_id = target_course_id
    and is_active
    and not (mentor_id = any(coalesce(target_mentor_ids, array[]::uuid[])));

  insert into public.course_mentors (course_id, mentor_id, is_active, removed_at)
  select target_course_id, mentor_id, true, null
  from (
    select distinct mentor_id
    from unnest(coalesce(target_mentor_ids, array[]::uuid[])) as requested(mentor_id)
  ) requested_mentors
  on conflict (course_id, mentor_id)
  do update set is_active = true, removed_at = null;
end;
$function$;

grant select, insert, update on public.mentor_reviews to authenticated;
