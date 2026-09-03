begin;

-- A message thread may originate from a lesson or from the student's
-- course-level inbox. Existing lesson threads keep their original relation.
alter table public.lesson_message_threads
  alter column lesson_id drop not null;

drop policy if exists lesson_message_threads_student_insert
on public.lesson_message_threads;

create policy lesson_message_threads_student_insert
on public.lesson_message_threads
for insert to authenticated
with check (
  student_profile_id = (select auth.uid())
  and (select public.current_profile_role()) = 'student'
  and (
    lesson_id is null
    or exists (
      select 1
      from public.lessons l
      where l.id = lesson_message_threads.lesson_id
        and l.course_id = lesson_message_threads.course_id
    )
  )
  and exists (
    select 1
    from public.enrollments e
    where e.profile_id = (select auth.uid())
      and e.course_id = lesson_message_threads.course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  )
);

-- Read state belongs to an individual account. This keeps unread counts
-- independent when several admins and mentors receive the same question.
create table public.lesson_message_thread_reads (
  thread_id uuid not null
    references public.lesson_message_threads(id) on delete cascade,
  profile_id uuid not null
    references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (thread_id, profile_id)
);

create index idx_lesson_message_thread_reads_profile
  on public.lesson_message_thread_reads(profile_id, thread_id);

create trigger trg_lesson_message_thread_reads_updated_at
before update on public.lesson_message_thread_reads
for each row execute function public.update_updated_at_column();

-- The former UI had no per-account read state. Treat messages that existed
-- before this feature as already read so the new badge starts accurately from
-- the moment this migration is installed.
insert into public.lesson_message_thread_reads (thread_id, profile_id, last_read_at)
select t.id, t.student_profile_id, now()
from public.lesson_message_threads t
union
select t.id, p.id, now()
from public.lesson_message_threads t
cross join public.profiles p
where p.role = 'admin'
union
select t.id, md.profile_id, now()
from public.lesson_message_threads t
join public.course_mentors cm on cm.course_id = t.course_id
join public.mentor_details md on md.id = cm.mentor_id;

alter table public.lesson_message_thread_reads enable row level security;

create policy lesson_message_thread_reads_select
on public.lesson_message_thread_reads
for select to authenticated
using (profile_id = (select auth.uid()));

create policy lesson_message_thread_reads_insert
on public.lesson_message_thread_reads
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_thread_reads.thread_id
      and (
        t.student_profile_id = (select auth.uid())
        or (select public.current_profile_role()) = 'admin'
        or (
          (select public.current_profile_role()) = 'mentor'
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

create policy lesson_message_thread_reads_update
on public.lesson_message_thread_reads
for update to authenticated
using (profile_id = (select auth.uid()))
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_thread_reads.thread_id
      and (
        t.student_profile_id = (select auth.uid())
        or (select public.current_profile_role()) = 'admin'
        or (
          (select public.current_profile_role()) = 'mentor'
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

grant select, insert on public.lesson_message_thread_reads to authenticated;
grant update (last_read_at) on public.lesson_message_thread_reads to authenticated;

-- RLS on entries and threads limits this security-invoker function to the
-- current user's visible conversations.
create or replace function public.count_unread_lesson_messages()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)
  from public.lesson_message_entries e
  join public.lesson_message_threads t on t.id = e.thread_id
  left join public.lesson_message_thread_reads r
    on r.thread_id = e.thread_id
   and r.profile_id = (select auth.uid())
  where e.sender_profile_id <> (select auth.uid())
    and e.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz);
$$;

revoke all on function public.count_unread_lesson_messages() from public;
grant execute on function public.count_unread_lesson_messages() to authenticated;

-- Return only profile names that the caller can see inside a visible message
-- thread. This lets every reply show the exact mentor/admin account name.
create or replace function public.get_message_participant_summaries(
  target_profile_ids uuid[]
)
returns table (
  id uuid,
  full_name text,
  university_origin text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller_role public.profile_role := (select public.current_profile_role());
begin
  if caller_role = 'admin' then
    return query
    select p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(target_profile_ids);
    return;
  end if;

  if caller_role = 'mentor' then
    return query
    select p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(target_profile_ids)
      and exists (
        select 1
        from public.lesson_message_threads t
        left join public.lesson_message_entries e on e.thread_id = t.id
        where public.is_assigned_mentor((select auth.uid()), t.course_id)
          and (
            t.student_profile_id = p.id
            or e.sender_profile_id = p.id
          )
      );
    return;
  end if;

  if caller_role = 'student' then
    return query
    select p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(target_profile_ids)
      and exists (
        select 1
        from public.lesson_message_threads t
        join public.lesson_message_entries e on e.thread_id = t.id
        where t.student_profile_id = (select auth.uid())
          and e.sender_profile_id = p.id
      );
    return;
  end if;

  raise exception 'Akses percakapan diperlukan.';
end;
$$;

revoke all on function public.get_message_participant_summaries(uuid[]) from public;
grant execute on function public.get_message_participant_summaries(uuid[]) to authenticated;

commit;
