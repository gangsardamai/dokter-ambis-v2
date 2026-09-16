-- Device session resilience: 30-day expiry, audit trail, and atomic registration.

create table if not exists public.device_session_audit (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  device_session_id uuid,
  device_identifier varchar(255) not null,
  device_name varchar(100) not null,
  device_type public.device_type not null,
  ip_address inet,
  user_agent text,
  last_login_at timestamptz,
  last_activity_at timestamptz,
  event_type text not null,
  actor_profile_id uuid,
  occurred_at timestamptz not null default now(),
  constraint chk_device_session_audit_event
    check (event_type in ('expired', 'admin_reset'))
);

create index if not exists idx_device_session_audit_profile_occurred
  on public.device_session_audit(profile_id, occurred_at desc);

alter table public.device_session_audit enable row level security;

drop policy if exists "Admins read device session audit" on public.device_session_audit;
create policy "Admins read device session audit"
  on public.device_session_audit
  for select
  to authenticated
  using ((select private.is_active_admin()));

revoke all on table public.device_session_audit from anon;
grant select on table public.device_session_audit to authenticated;

create or replace function public.register_or_refresh_student_device(
  p_device_identifier text,
  p_device_name text,
  p_device_type public.device_type,
  p_user_agent text default null,
  p_ip_address inet default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth', 'private', 'pg_temp'
as $function$
declare
  v_profile_id uuid := auth.uid();
  v_role text;
  v_status text;
  v_now timestamptz := now();
  v_existing public.device_sessions%rowtype;
  v_active_count integer := 0;
  v_session_id uuid;
begin
  if v_profile_id is null then
    raise exception 'Sesi login tidak ditemukan. Silakan masuk kembali.'
      using errcode = '42501';
  end if;

  if p_device_identifier is null or length(btrim(p_device_identifier)) = 0 then
    raise exception 'Identitas perangkat tidak ditemukan. Silakan muat ulang halaman login.'
      using errcode = '22023';
  end if;

  if p_device_name is null or length(btrim(p_device_name)) = 0 then
    raise exception 'Nama perangkat tidak ditemukan.'
      using errcode = '22023';
  end if;

  -- Serialize registrations for the same account so two simultaneous logins
  -- cannot both claim the final available slot.
  select p.role::text, p.status::text
  into v_role, v_status
  from public.profiles p
  where p.id = v_profile_id
  for update;

  if not found then
    raise exception 'Profil peserta tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  if v_role <> 'student' or v_status <> 'active' then
    raise exception 'Akun peserta tidak aktif.'
      using errcode = '42501';
  end if;

  -- Archive and release device slots that have not been used for 30 days.
  insert into public.device_session_audit (
    profile_id,
    device_session_id,
    device_identifier,
    device_name,
    device_type,
    ip_address,
    user_agent,
    last_login_at,
    last_activity_at,
    event_type,
    actor_profile_id
  )
  select
    ds.profile_id,
    ds.id,
    ds.device_identifier,
    ds.device_name,
    ds.device_type,
    ds.ip_address,
    ds.user_agent,
    ds.last_login_at,
    ds.last_activity_at,
    'expired',
    v_profile_id
  from public.device_sessions ds
  where ds.profile_id = v_profile_id
    and ds.is_active = true
    and ds.last_activity_at < (v_now - interval '30 days');

  delete from public.device_sessions ds
  where ds.profile_id = v_profile_id
    and ds.is_active = true
    and ds.last_activity_at < (v_now - interval '30 days');

  select ds.*
  into v_existing
  from public.device_sessions ds
  where ds.profile_id = v_profile_id
    and ds.device_identifier = p_device_identifier
  limit 1;

  if found then
    if not v_existing.is_active then
      raise exception 'Perangkat ini telah dinonaktifkan. Silakan hubungi administrator.'
        using errcode = '42501';
    end if;

    update public.device_sessions
    set device_name = p_device_name,
        device_type = p_device_type,
        user_agent = nullif(btrim(p_user_agent), ''),
        ip_address = p_ip_address,
        last_login_at = v_now,
        last_activity_at = v_now,
        updated_at = v_now
    where id = v_existing.id
    returning id into v_session_id;

    return v_session_id;
  end if;

  select count(*)::integer
  into v_active_count
  from public.device_sessions ds
  where ds.profile_id = v_profile_id
    and ds.is_active = true;

  if v_active_count >= 2 then
    raise exception 'Batas maksimal 2 perangkat telah tercapai. Silakan hubungi administrator untuk mengganti perangkat.'
      using errcode = 'P0001';
  end if;

  insert into public.device_sessions (
    profile_id,
    device_identifier,
    device_name,
    device_type,
    user_agent,
    ip_address,
    is_active,
    last_login_at,
    last_activity_at,
    created_at,
    updated_at
  )
  values (
    v_profile_id,
    p_device_identifier,
    p_device_name,
    p_device_type,
    nullif(btrim(p_user_agent), ''),
    p_ip_address,
    true,
    v_now,
    v_now,
    v_now,
    v_now
  )
  returning id into v_session_id;

  return v_session_id;
end;
$function$;

revoke all on function public.register_or_refresh_student_device(text, text, public.device_type, text, inet) from public;
revoke all on function public.register_or_refresh_student_device(text, text, public.device_type, text, inet) from anon;
grant execute on function public.register_or_refresh_student_device(text, text, public.device_type, text, inet) to authenticated;

create or replace function public.admin_reset_student_devices(target_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public', 'auth', 'private', 'pg_temp'
as $function$
declare
  target_role text;
  deleted_count integer := 0;
begin
  if not private.is_active_admin() then
    raise exception 'Anda tidak memiliki izin sebagai admin.'
      using errcode = '42501';
  end if;

  if target_profile_id is null then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = '22023';
  end if;

  select p.role::text
  into target_role
  from public.profiles p
  where p.id = target_profile_id
  for update;

  if not found then
    raise exception 'Akun mahasiswa tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  if target_role <> 'student' then
    raise exception 'Reset device hanya dapat dilakukan untuk akun mahasiswa.'
      using errcode = '42501';
  end if;

  insert into public.device_session_audit (
    profile_id,
    device_session_id,
    device_identifier,
    device_name,
    device_type,
    ip_address,
    user_agent,
    last_login_at,
    last_activity_at,
    event_type,
    actor_profile_id
  )
  select
    ds.profile_id,
    ds.id,
    ds.device_identifier,
    ds.device_name,
    ds.device_type,
    ds.ip_address,
    ds.user_agent,
    ds.last_login_at,
    ds.last_activity_at,
    'admin_reset',
    auth.uid()
  from public.device_sessions ds
  where ds.profile_id = target_profile_id;

  delete from public.device_sessions
  where profile_id = target_profile_id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$;

revoke all on function public.admin_reset_student_devices(uuid) from public;
revoke all on function public.admin_reset_student_devices(uuid) from anon;
grant execute on function public.admin_reset_student_devices(uuid) to authenticated;
