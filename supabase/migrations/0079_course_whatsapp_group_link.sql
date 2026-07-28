create table if not exists public.course_community_links (
  course_id uuid primary key
    references public.courses(id) on delete cascade,
  whatsapp_group_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_course_community_links_whatsapp_url
    check (
      whatsapp_group_url ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9_-]+$'
    )
);

alter table public.course_community_links enable row level security;

grant select, insert, update, delete
  on table public.course_community_links
  to authenticated;

create or replace trigger trg_course_community_links_updated_at
before update on public.course_community_links
for each row
execute function public.update_updated_at_column();

drop policy if exists "course_community_links_admin_select"
  on public.course_community_links;
create policy "course_community_links_admin_select"
on public.course_community_links
for select
to authenticated
using ((select private.is_active_admin()));

drop policy if exists "course_community_links_student_select"
  on public.course_community_links;
create policy "course_community_links_student_select"
on public.course_community_links
for select
to authenticated
using (
  (select private.is_active_student())
  and exists (
    select 1
    from public.enrollments e
    where e.profile_id = (select auth.uid())
      and e.course_id = course_community_links.course_id
      and e.status = 'active'::public.enrollment_status
  )
);

drop policy if exists "course_community_links_admin_insert"
  on public.course_community_links;
create policy "course_community_links_admin_insert"
on public.course_community_links
for insert
to authenticated
with check ((select private.is_active_admin()));

drop policy if exists "course_community_links_admin_update"
  on public.course_community_links;
create policy "course_community_links_admin_update"
on public.course_community_links
for update
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

drop policy if exists "course_community_links_admin_delete"
  on public.course_community_links;
create policy "course_community_links_admin_delete"
on public.course_community_links
for delete
to authenticated
using ((select private.is_active_admin()));
