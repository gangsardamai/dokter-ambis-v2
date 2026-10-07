alter table public.enrollments
  add column if not exists whatsapp_joined_at timestamptz null;

create index if not exists idx_enrollments_whatsapp_not_joined
  on public.enrollments (course_id, enrolled_at desc)
  where whatsapp_joined_at is null;

create index if not exists idx_enrollments_whatsapp_joined
  on public.enrollments (course_id, whatsapp_joined_at desc)
  where whatsapp_joined_at is not null;

create or replace function public.student_confirm_whatsapp_joined(
  target_enrollment_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  joined_at_value timestamptz;
begin
  if not private.is_active_student() then
    raise exception 'Akses peserta aktif diperlukan.'
      using errcode='42501';
  end if;

  update public.enrollments e
  set whatsapp_joined_at = coalesce(e.whatsapp_joined_at, now()),
      updated_at = now()
  where e.id = target_enrollment_id
    and e.profile_id = auth.uid()
    and e.status = 'active'::public.enrollment_status
    and exists (
      select 1
      from public.course_community_links ccl
      where ccl.course_id = e.course_id
    )
  returning e.whatsapp_joined_at into joined_at_value;

  if joined_at_value is null then
    raise exception 'Enrollment aktif atau grup WhatsApp tidak ditemukan.'
      using errcode='42501';
  end if;

  return joined_at_value;
end;
$$;

revoke all on function public.student_confirm_whatsapp_joined(uuid)
  from public, anon;
grant execute on function public.student_confirm_whatsapp_joined(uuid)
  to authenticated;

create or replace function public.staff_set_enrollment_whatsapp_joined(
  target_enrollment_id uuid,
  target_joined boolean
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_course_id uuid;
  joined_at_value timestamptz;
begin
  select e.course_id
  into target_course_id
  from public.enrollments e
  where e.id = target_enrollment_id;

  if target_course_id is null then
    raise exception 'Enrollment tidak ditemukan.'
      using errcode='P0002';
  end if;

  if not (
    private.is_active_admin()
    or (
      private.is_active_leader()
      and private.leader_has_permission('manage_enrollment')
      and private.leader_can_access_course(target_course_id)
    )
  ) then
    raise exception 'Akses pengelolaan enrollment diperlukan.'
      using errcode='42501';
  end if;

  update public.enrollments e
  set whatsapp_joined_at =
        case
          when target_joined then coalesce(e.whatsapp_joined_at, now())
          else null
        end,
      updated_at = now()
  where e.id = target_enrollment_id
  returning e.whatsapp_joined_at into joined_at_value;

  return joined_at_value;
end;
$$;

revoke all on function public.staff_set_enrollment_whatsapp_joined(uuid, boolean)
  from public, anon;
grant execute on function public.staff_set_enrollment_whatsapp_joined(uuid, boolean)
  to authenticated;
