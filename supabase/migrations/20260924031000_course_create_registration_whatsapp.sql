-- Course setup helpers for Admin + scoped Leader.
-- 1) Extend course_community_links management to active Leaders inside course scope.
-- 2) Add atomic Course + optional WhatsApp group creation for staff.

alter policy "course_community_links_admin_select"
on public.course_community_links
using (
  (select private.is_active_admin())
  or (
    private.is_active_leader()
    and private.leader_can_access_course(course_community_links.course_id)
  )
);

alter policy "course_community_links_admin_insert"
on public.course_community_links
with check (
  (select private.is_active_admin())
  or (
    private.is_active_leader()
    and private.leader_can_access_course(course_community_links.course_id)
  )
);

alter policy "course_community_links_admin_update"
on public.course_community_links
using (
  (select private.is_active_admin())
  or (
    private.is_active_leader()
    and private.leader_can_access_course(course_community_links.course_id)
  )
)
with check (
  (select private.is_active_admin())
  or (
    private.is_active_leader()
    and private.leader_can_access_course(course_community_links.course_id)
  )
);

alter policy "course_community_links_admin_delete"
on public.course_community_links
using (
  (select private.is_active_admin())
  or (
    private.is_active_leader()
    and private.leader_can_access_course(course_community_links.course_id)
  )
);

create or replace function public.staff_create_course_with_setup(
  payload jsonb,
  whatsapp_group_url text default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  record_id uuid := gen_random_uuid();
  columns_sql text;
  values_sql text;
  result jsonb;
  normalized_whatsapp text := nullif(btrim(coalesce(whatsapp_group_url, '')), '');
begin
  if not (
    private.is_active_admin()
    or private.leader_has_permission('manage_master_data')
  ) then
    raise exception 'Akses Master Data diperlukan.'
      using errcode='42501';
  end if;

  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'Data Course tidak valid.'
      using errcode='22023';
  end if;

  if normalized_whatsapp is not null
     and normalized_whatsapp !~ '^https://chat\.whatsapp\.com/[A-Za-z0-9_-]+$' then
    raise exception 'Link harus menggunakan format https://chat.whatsapp.com/...'
      using errcode='22023';
  end if;

  payload :=
    (payload - array['id','created_by','updated_by','created_at','updated_at'])
    || jsonb_build_object('id', record_id);

  select
    string_agg(format('%I', key), ',' order by key),
    string_agg(format('r.%I', key), ',' order by key)
  into columns_sql, values_sql
  from jsonb_object_keys(payload) key;

  execute format(
    'insert into public.courses (%s)
     select %s
     from jsonb_populate_record(null::public.courses, $1) r',
    columns_sql,
    values_sql
  )
  using payload;

  if normalized_whatsapp is not null then
    insert into public.course_community_links(
      course_id,
      whatsapp_group_url
    )
    values(
      record_id,
      normalized_whatsapp
    );
  end if;

  select to_jsonb(c)
  into result
  from public.courses c
  where c.id = record_id;

  if result is null then
    raise exception 'Course tidak dapat diakses.'
      using errcode='42501';
  end if;

  return result;
end;
$$;

revoke all on function public.staff_create_course_with_setup(jsonb, text) from public, anon;
grant execute on function public.staff_create_course_with_setup(jsonb, text) to authenticated;
