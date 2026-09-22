create table if not exists public.course_pins (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  pinned_at timestamptz not null default now(),
  primary key (profile_id, course_id)
);

create index if not exists course_pins_course_id_idx
  on public.course_pins (course_id);

alter table public.course_pins enable row level security;

drop policy if exists "course_pins_select_own" on public.course_pins;
create policy "course_pins_select_own"
  on public.course_pins
  for select
  to authenticated
  using ((select auth.uid()) = profile_id);

drop policy if exists "course_pins_insert_own" on public.course_pins;
create policy "course_pins_insert_own"
  on public.course_pins
  for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

drop policy if exists "course_pins_update_own" on public.course_pins;
create policy "course_pins_update_own"
  on public.course_pins
  for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "course_pins_delete_own" on public.course_pins;
create policy "course_pins_delete_own"
  on public.course_pins
  for delete
  to authenticated
  using ((select auth.uid()) = profile_id);

grant select, insert, update, delete on public.course_pins to authenticated;
