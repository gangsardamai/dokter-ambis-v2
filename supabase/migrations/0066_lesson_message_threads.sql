begin;

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

create table if not exists public.lesson_message_threads (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'open'
    check (status in ('open', 'answered', 'closed')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_lesson_message_thread_student_lesson
    unique (student_profile_id, lesson_id)
);

create table if not exists public.lesson_message_entries (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.lesson_message_threads(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  sender_role public.profile_role not null,
  message text not null
    check (char_length(btrim(message)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chk_lesson_message_sender_role
    check (sender_role in ('student', 'admin'))
);

create index if not exists idx_lesson_message_threads_student
  on public.lesson_message_threads(student_profile_id, last_message_at desc);
create index if not exists idx_lesson_message_threads_course
  on public.lesson_message_threads(course_id, last_message_at desc);
create index if not exists idx_lesson_message_threads_lesson
  on public.lesson_message_threads(lesson_id, last_message_at desc);
create index if not exists idx_lesson_message_threads_status
  on public.lesson_message_threads(status, last_message_at desc);
create index if not exists idx_lesson_message_entries_thread
  on public.lesson_message_entries(thread_id, created_at asc);

create or replace function public.sync_lesson_message_thread_after_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lesson_message_threads
  set
    status = case
      when new.sender_role = 'admin' then 'answered'
      else 'open'
    end,
    last_message_at = new.created_at,
    updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

revoke all on function public.sync_lesson_message_thread_after_entry() from public;

create trigger trg_lesson_message_threads_updated_at
before update on public.lesson_message_threads
for each row execute function public.update_updated_at_column();

create trigger trg_lesson_message_entry_sync_thread
after insert on public.lesson_message_entries
for each row execute function public.sync_lesson_message_thread_after_entry();

alter table public.lesson_message_threads enable row level security;
alter table public.lesson_message_entries enable row level security;

create policy lesson_message_threads_select
on public.lesson_message_threads
for select
to authenticated
using (
  student_profile_id = auth.uid()
  or public.current_profile_role() = 'admin'
);

create policy lesson_message_threads_student_insert
on public.lesson_message_threads
for insert
to authenticated
with check (
  student_profile_id = auth.uid()
  and public.current_profile_role() = 'student'
  and exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and l.course_id = course_id
  )
  and exists (
    select 1
    from public.enrollments e
    where e.profile_id = auth.uid()
      and e.course_id = course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  )
);

create policy lesson_message_threads_admin_update
on public.lesson_message_threads
for update
to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy lesson_message_entries_select
on public.lesson_message_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.lesson_message_threads t
    where t.id = thread_id
      and (
        t.student_profile_id = auth.uid()
        or public.current_profile_role() = 'admin'
      )
  )
);

create policy lesson_message_entries_insert
on public.lesson_message_entries
for insert
to authenticated
with check (
  sender_profile_id = auth.uid()
  and sender_role = public.current_profile_role()
  and sender_role in ('student', 'admin')
  and exists (
    select 1
    from public.lesson_message_threads t
    where t.id = thread_id
      and (
        (sender_role = 'student' and t.student_profile_id = auth.uid())
        or sender_role = 'admin'
      )
  )
);

grant select, insert on public.lesson_message_threads to authenticated;
grant update (status) on public.lesson_message_threads to authenticated;
grant select, insert on public.lesson_message_entries to authenticated;

commit;
