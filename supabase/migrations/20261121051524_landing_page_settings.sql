begin;

create table public.landing_page_settings (
  id integer primary key check (id = 1),
  course_ids uuid[] check (cardinality(course_ids) <= 4),
  mentors jsonb check (jsonb_typeof(mentors) = 'array'),
  revision uuid not null default gen_random_uuid()
);

insert into public.landing_page_settings (id) values (1);

alter table public.landing_page_settings enable row level security;
revoke all on public.landing_page_settings from public, anon, authenticated;
grant select on public.landing_page_settings to anon, authenticated;
grant update (course_ids, mentors, revision) on public.landing_page_settings to authenticated;

create policy "Public landing page settings"
  on public.landing_page_settings for select to anon, authenticated
  using (true);

create policy "Active admins can edit landing page settings"
  on public.landing_page_settings for update to authenticated
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'active'
  ))
  with check (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'active'
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-mentor-photos', 'landing-mentor-photos', true, 3145728,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Active admins can upload landing mentor photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'landing-mentor-photos' and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin' and status = 'active'
    )
  );

commit;
