-- Reviewed against the five Leader migrations already installed in production.
-- Ancestor visibility is NOT authority to edit that ancestor or all its students.
create or replace function private.leader_manages_organization(target_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select private.is_active_leader() and exists (
   select 1 from public.leader_scopes where leader_id=(select auth.uid()) and organization_id=target_id
 );
$$;
create or replace function private.leader_manages_program(target_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select private.is_active_leader() and exists (
   select 1 from public.programs p join public.leader_scopes s
     on s.program_id=p.id or s.organization_id=p.organization_id
   where p.id=target_id and s.leader_id=(select auth.uid())
 );
$$;
revoke all on function private.leader_manages_organization(uuid) from public;
revoke all on function private.leader_manages_program(uuid) from public;
grant execute on function private.leader_manages_organization(uuid),private.leader_manages_program(uuid) to authenticated;
alter policy "announcement_organizations_staff_delete" on public.announcement_organizations using ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_announcements'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_organization(announcement_organizations.organization_id) AS leader_can_access_organization) AND (EXISTS ( SELECT 1
   FROM announcements a
  WHERE ((a.id = announcement_organizations.announcement_id) AND (a.created_by = ( SELECT auth.uid() AS uid))))))));
alter policy "announcement_organizations_staff_insert" on public.announcement_organizations with check ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_announcements'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_organization(announcement_organizations.organization_id) AS leader_can_access_organization) AND (EXISTS ( SELECT 1
   FROM announcements a
  WHERE ((a.id = announcement_organizations.announcement_id) AND (a.created_by = ( SELECT auth.uid() AS uid)) AND (a.all_students = false)))))));
alter policy "announcement_organizations_staff_update" on public.announcement_organizations using ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_announcements'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_organization(announcement_organizations.organization_id) AS leader_can_access_organization) AND (EXISTS ( SELECT 1
   FROM announcements a
  WHERE ((a.id = announcement_organizations.announcement_id) AND (a.created_by = ( SELECT auth.uid() AS uid)))))))) with check ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_announcements'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_organization(announcement_organizations.organization_id) AS leader_can_access_organization) AND (EXISTS ( SELECT 1
   FROM announcements a
  WHERE ((a.id = announcement_organizations.announcement_id) AND (a.created_by = ( SELECT auth.uid() AS uid)) AND (a.all_students = false)))))));
alter policy "organizations_staff_update" on public.organizations using ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_master_data'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_organization(organizations.id) AS leader_can_access_organization)))) with check ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_master_data'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_organization(organizations.id) AS leader_can_access_organization))));
alter policy "programs_staff_insert" on public.programs with check ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_master_data'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_organization(programs.organization_id) AS leader_can_access_organization))));
alter policy "programs_staff_update" on public.programs using ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_master_data'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_program(programs.id) AS leader_can_access_program)))) with check ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_master_data'::text) AS leader_has_permission) AND ( SELECT private.leader_manages_program(programs.id) AS leader_can_access_program))));
alter policy "courses_staff_insert" on public.courses with check ((( SELECT private.is_active_admin() AS is_active_admin) OR (( SELECT private.leader_has_permission('manage_master_data'::text) AS leader_has_permission) AND ( SELECT private.leader_can_access_organization(courses.organization_id) AS leader_can_access_organization) AND ( SELECT private.leader_manages_program(courses.program_id) AS leader_can_access_program))));
CREATE OR REPLACE FUNCTION private.leader_can_manage_announcement(target_announcement_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    private.leader_has_permission('manage_announcements')
    and exists (
      select 1
      from public.announcements a
      where a.id = target_announcement_id
        and a.all_students = false
        and (
          exists (
            select 1 from public.announcement_organizations ao
            where ao.announcement_id = a.id
          )
          or exists (
            select 1 from public.announcement_courses ac
            where ac.announcement_id = a.id
          )
        )
        and not exists (
          select 1
          from public.announcement_organizations ao
          where ao.announcement_id = a.id
            and not private.leader_manages_organization(ao.organization_id)
        )
        and not exists (
          select 1
          from public.announcement_courses ac
          where ac.announcement_id = a.id
            and not private.leader_can_access_course(ac.course_id)
        )
    );
$function$
;
CREATE OR REPLACE FUNCTION private.guard_leader_parent_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not private.is_active_leader() then
    return new;
  end if;

  if tg_table_name = 'programs'
     and new.organization_id is distinct from old.organization_id
     and not private.leader_manages_organization(new.organization_id) then
    raise exception 'Program tidak dapat dipindahkan ke universitas di luar scope Leader.'
      using errcode = '42501';
  end if;

  if tg_table_name = 'courses'
     and (
       new.organization_id is distinct from old.organization_id
       or new.program_id is distinct from old.program_id
     )
     and (
       not private.leader_can_access_organization(new.organization_id)
       or not private.leader_manages_program(new.program_id)
     ) then
    raise exception 'Course tidak dapat dipindahkan ke parent di luar scope Leader.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$
;

-- Prevent forged creator IDs and changes to ownership in master data.
create or replace function private.set_master_audit_fields()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then new.created_by:=auth.uid();
 else
  new.created_by:=old.created_by;
  if private.is_active_leader() and new.id is distinct from old.id then
   raise exception 'ID Master Data tidak dapat diubah.' using errcode='42501';
  end if;
  new.created_at:=old.created_at;
 end if;
 new.updated_by:=auth.uid();
 return new;
end;
$$;

-- INSERT ... RETURNING is checked before the AFTER trigger gives the Leader scope.
-- Insert and read in one transaction, as the caller, so RLS remains authoritative.
create or replace function public.staff_create_master_record(target_type text, payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 target_table text;
 record_id uuid:=gen_random_uuid();
 columns_sql text;
 values_sql text;
 result jsonb;
begin
 if not (private.is_active_admin() or private.leader_has_permission('manage_master_data')) then
  raise exception 'Akses Master Data diperlukan.' using errcode='42501';
 end if;
 target_table:=case target_type when 'organization' then 'organizations' when 'program' then 'programs' when 'course' then 'courses' end;
 if target_table is null or jsonb_typeof(payload) is distinct from 'object' then
  raise exception 'Data Master Data tidak valid.' using errcode='22023';
 end if;
 payload:=(payload - array['id','created_by','updated_by','created_at','updated_at']) || jsonb_build_object('id',record_id);
 select string_agg(format('%I',key),',' order by key),string_agg(format('r.%I',key),',' order by key)
 into columns_sql,values_sql from jsonb_object_keys(payload) key;
 execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) r',target_table,columns_sql,values_sql,target_table) using payload;
 execute format('select to_jsonb(r) from public.%I r where id=$1',target_table) into result using record_id;
 if result is null then raise exception 'Master Data tidak dapat diakses.' using errcode='42501'; end if;
 return result;
end;
$$;
revoke all on function public.staff_create_master_record(text,jsonb) from public,anon;
grant execute on function public.staff_create_master_record(text,jsonb) to authenticated;

-- Enrollment permission does not authorize pricing, payment verification or identity changes.
create or replace function private.guard_leader_enrollment_write()
returns trigger language plpgsql security definer set search_path='' as $$
declare c public.courses;
begin
 if not private.is_active_leader() then return new; end if;
 if not private.leader_can_manage_course_for(new.course_id,'manage_enrollment') then
  raise exception 'Enrollment di luar scope Leader.' using errcode='42501';
 end if;
 if tg_op='INSERT' then
  select * into c from public.courses where id=new.course_id;
  if c.status<>'active' or not exists(select 1 from public.profiles where id=new.profile_id and role='student' and status='active')
     or new.price_snapshot is distinct from (case when c.is_free then 0 else c.price end)
     or new.discount_amount<>0 or new.promotion_id is not null or new.promotion_code_snapshot is not null or new.promotion_name_snapshot is not null
     or new.activated_at is not null or new.expired_at is not null
     or new.status is distinct from (case when new.payment_timing='deferred' then 'pending_approval'::public.enrollment_status else 'pending_payment'::public.enrollment_status end)
  then raise exception 'Data awal enrollment tidak valid.' using errcode='42501'; end if;
 else
  if (to_jsonb(new)-array['status','category','activated_at','updated_at']) is distinct from (to_jsonb(old)-array['status','category','activated_at','updated_at']) then
   raise exception 'Leader tidak dapat mengubah identitas, harga, masa akses atau kategori pembayaran.' using errcode='42501';
  end if;
  if new.status is distinct from old.status then
   if new.status='active' and old.status='pending_approval' and old.payment_timing='deferred' then
    new.activated_at:=now();
   elsif new.status='cancelled' and old.status in ('pending_payment','pending_approval','active') then
    new.activated_at:=null;
   else raise exception 'Perubahan status enrollment tidak diizinkan untuk Leader.' using errcode='42501'; end if;
  elsif new.activated_at is distinct from old.activated_at then
   raise exception 'Waktu aktivasi tidak dapat diubah Leader.' using errcode='42501';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function private.guard_leader_enrollment_write() from public;
create trigger trg_enrollments_guard_leader before insert or update on public.enrollments
for each row execute function private.guard_leader_enrollment_write();
alter policy enrollments_staff_delete on public.enrollments using ((select private.is_active_admin()));
CREATE OR REPLACE FUNCTION private.guard_student_enrollment_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Leader writes are independently validated by trg_enrollments_guard_leader.
  if private.is_active_leader() then return new; end if;
  if private.is_active_admin() then
    return new;
  end if;

  if current_setting('app.promotion_checkout', true) = 'on' then
    return new;
  end if;

  if (select auth.uid()) is null
     or old.profile_id <> (select auth.uid()) then
    raise exception 'Enrollment hanya dapat diubah oleh pemilik atau admin.'
      using errcode = '42501';
  end if;

  if old.status not in (
       'pending_payment'::public.enrollment_status,
       'pending_approval'::public.enrollment_status
     )
     or new.status <> 'pending_approval'::public.enrollment_status then
    raise exception 'Perubahan status enrollment tidak diizinkan.'
      using errcode = '42501';
  end if;

  if row(
       new.id,
       new.profile_id,
       new.course_id,
       new.category,
       new.payment_timing,
       new.price_snapshot,
       new.enrolled_at,
       new.activated_at,
       new.expired_at,
       new.created_at,
       new.promotion_id,
       new.promotion_code_snapshot,
       new.promotion_name_snapshot,
       new.discount_amount
     ) is distinct from row(
       old.id,
       old.profile_id,
       old.course_id,
       old.category,
       old.payment_timing,
       old.price_snapshot,
       old.enrolled_at,
       old.activated_at,
       old.expired_at,
       old.created_at,
       old.promotion_id,
       old.promotion_code_snapshot,
       old.promotion_name_snapshot,
       old.discount_amount
     ) then
    raise exception 'Kolom enrollment yang dilindungi tidak boleh diubah peserta.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$
;

-- Preserve message participants/course; the entry trigger alone can update last-message metadata.
create or replace function private.guard_leader_thread_update()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if private.is_active_leader() and pg_trigger_depth()=1 and
   (to_jsonb(new)-array['status','updated_at']) is distinct from (to_jsonb(old)-array['status','updated_at']) then
  raise exception 'Leader hanya dapat mengubah status percakapan.' using errcode='42501';
 end if;
 return new;
end;
$$;
revoke all on function private.guard_leader_thread_update() from public;
create trigger trg_message_thread_guard_leader before update on public.lesson_message_threads
for each row execute function private.guard_leader_thread_update();

-- Save announcement and audience together. Any invalid target rolls back all changes.
create or replace function public.staff_save_announcement(target_id uuid, payload jsonb, organization_ids uuid[], course_ids uuid[])
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.announcements; result jsonb; aid uuid:=coalesce(target_id,gen_random_uuid());
begin
 if not (private.is_active_admin() or private.leader_has_permission('manage_announcements')) then
  raise exception 'Akses Pengumuman diperlukan.' using errcode='42501';
 end if;
 if target_id is not null then
  select * into a from public.announcements where id=target_id for update;
  if not found or (not private.is_active_admin() and a.created_by<>auth.uid()) then
   raise exception 'Pengumuman tidak dapat diubah.' using errcode='42501';
  end if;
 end if;
 if coalesce((payload->>'all_students')::boolean,false) and not private.is_active_admin() then
  raise exception 'Pengumuman global hanya untuk Admin.' using errcode='42501';
 end if;
 if not coalesce((payload->>'all_students')::boolean,false) and coalesce(cardinality(organization_ids),0)+coalesce(cardinality(course_ids),0)=0 then
  raise exception 'Pilih minimal satu universitas atau course.' using errcode='22023';
 end if;
 if private.is_active_leader() and (
   exists(select 1 from unnest(organization_ids) x where not coalesce(private.leader_manages_organization(x),false))
   or exists(select 1 from unnest(course_ids) x where not coalesce(private.leader_can_access_course(x),false))
 ) then raise exception 'Target pengumuman di luar scope Leader.' using errcode='42501'; end if;
 if target_id is null then
  insert into public.announcements(id,created_by,title,content,all_students,is_published,starts_at,ends_at,show_on_dashboard,display_order)
  values(aid,auth.uid(),payload->>'title',payload->>'content',coalesce((payload->>'all_students')::boolean,false),coalesce((payload->>'is_published')::boolean,false),(payload->>'starts_at')::timestamptz,(payload->>'ends_at')::timestamptz,coalesce((payload->>'show_on_dashboard')::boolean,true),coalesce((select max(display_order)+10 from public.announcements),10));
 else
  update public.announcements set title=payload->>'title',content=payload->>'content',all_students=coalesce((payload->>'all_students')::boolean,false),is_published=coalesce((payload->>'is_published')::boolean,false),starts_at=(payload->>'starts_at')::timestamptz,ends_at=(payload->>'ends_at')::timestamptz,show_on_dashboard=coalesce((payload->>'show_on_dashboard')::boolean,true) where id=aid;
  if not found then raise exception 'Pengumuman tidak dapat diubah.' using errcode='42501'; end if;
  delete from public.announcement_organizations where announcement_id=aid;
  delete from public.announcement_courses where announcement_id=aid;
 end if;
 if not coalesce((payload->>'all_students')::boolean,false) then
  insert into public.announcement_organizations(announcement_id,organization_id) select aid,x from (select distinct unnest(organization_ids) x) t;
  insert into public.announcement_courses(announcement_id,course_id) select aid,x from (select distinct unnest(course_ids) x) t;
 end if;
 select to_jsonb(t) into result from public.announcements t where id=aid;
 if result is null then raise exception 'Pengumuman tidak dapat diakses.' using errcode='42501'; end if;
 return result;
end;
$$;
revoke all on function public.staff_save_announcement(uuid,jsonb,uuid[],uuid[]) from public,anon;
grant execute on function public.staff_save_announcement(uuid,jsonb,uuid[],uuid[]) to authenticated;

-- Append-only audit events; do not duplicate message bodies or student contact details.
create table public.leader_audit_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null,
 entity_type text not null, entity_id uuid, action text not null,
 changes jsonb not null, created_at timestamptz not null default now()
);
alter table public.leader_audit_events enable row level security;
revoke all on public.leader_audit_events from anon,authenticated;
grant select on public.leader_audit_events to authenticated;
create policy leader_audit_admin_read on public.leader_audit_events for select to authenticated using ((select private.is_active_admin()));
create index leader_audit_events_actor_created_idx on public.leader_audit_events(actor_id,created_at desc);
create index leader_audit_events_created_idx on public.leader_audit_events(created_at desc);
create or replace function private.audit_leader_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare before_row jsonb:=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;
 after_row jsonb:=case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;
 diff jsonb;
 changed_fields jsonb;
begin
 if not (private.is_active_leader() or tg_table_name in ('leader_scopes','leader_permissions') or
 (tg_table_name='profiles' and (before_row->>'role'='leader' or after_row->>'role'='leader'))) then
  return coalesce(new,old);
 end if;
 select coalesce(jsonb_object_agg(k,jsonb_build_object('before',before_row->k,'after',after_row->k)),'{}'::jsonb) into diff
 from unnest(array['role','status','leader_id','organization_id','program_id','course_id','profile_id','permission','enabled','category','payment_timing','price_snapshot','discount_amount','activated_at','expired_at','all_students','is_published','created_by','updated_by','title','announcement_id','thread_id','sender_profile_id']) k
 where (before_row->k) is distinct from (after_row->k);
 select coalesce(jsonb_agg(k order by k),'[]'::jsonb) into changed_fields
 from (select jsonb_object_keys(before_row || after_row) k) fields
 where k<>'updated_at' and (before_row->k) is distinct from (after_row->k);
 diff:=diff || jsonb_build_object('_changed_fields',changed_fields);
 if tg_op<>'UPDATE' or changed_fields<>'[]'::jsonb then
  insert into public.leader_audit_events(actor_id,entity_type,entity_id,action,changes)
  values(auth.uid(),tg_table_name,coalesce(after_row->>'id',before_row->>'id',after_row->>'leader_id',before_row->>'leader_id')::uuid,tg_op,diff);
 end if;
 return coalesce(new,old);
end;
$$;
revoke all on function private.audit_leader_change() from public;
do $$ declare t text; begin
 foreach t in array array['profiles','leader_scopes','leader_permissions','organizations','programs','courses','enrollments','announcements','announcement_organizations','announcement_courses','lesson_message_threads','lesson_message_entries'] loop
  execute format('create trigger trg_audit_leader_change after insert or update or delete on public.%I for each row execute function private.audit_leader_change()',t);
 end loop;
end $$;
-- Exact phone lookup uses the same expression as the existing staff RPC.
create index if not exists profiles_active_student_normalized_phone_idx on public.profiles
 ((regexp_replace(coalesce(phone,''),'[^0-9]','','g'))) where role='student' and status='active';

-- A course must not use a program from a different university to extend scope.
create or replace function private.guard_leader_master_parent_integrity()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active_leader() then return new; end if;
 if tg_table_name='courses' then
  if not exists(select 1 from public.programs where id=new.program_id and organization_id=new.organization_id) then
   raise exception 'Program tidak sesuai universitas Course.' using errcode='42501';
  end if;
 elsif tg_table_name='organizations' and new.is_general then
  raise exception 'Universitas umum hanya dapat dikelola Admin.' using errcode='42501';
 end if;
 return new;
end;
$$;
revoke all on function private.guard_leader_master_parent_integrity() from public;
create trigger trg_courses_leader_parent_integrity before insert or update on public.courses
for each row execute function private.guard_leader_master_parent_integrity();
create trigger trg_organizations_leader_parent_integrity before insert or update on public.organizations
for each row execute function private.guard_leader_master_parent_integrity();

-- Leader replies must satisfy both the role CHECK and the thread status trigger.
alter table public.lesson_message_entries drop constraint chk_lesson_message_sender_role;
alter table public.lesson_message_entries add constraint chk_lesson_message_sender_role
check (sender_role in ('student','mentor','leader','admin'));
CREATE OR REPLACE FUNCTION public.sync_lesson_message_thread_after_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.lesson_message_threads
  set
    status = case
      when new.sender_role in (
        'admin'::public.profile_role,
        'mentor'::public.profile_role,
        'leader'::public.profile_role
      ) then 'answered'
      else 'open'
    end,
    last_message_at = new.created_at,
    updated_at = now()
  where id = new.thread_id;

  return new;
end;
$function$
;
