-- Archived from production migration history.
-- Production version: 20260726145614
-- Production name: 0074_payment_account_security_performance_followup
-- Intentionally stored outside supabase/migrations so migration tooling does not replay it.

-- 0074: payment-account RPCs, active-account guards, normalized data, and access-policy follow-up

-- Normalize account data before constraints/indexes and reject invalid/default-inactive states.
create or replace function private.normalize_payment_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.bank_name := btrim(new.bank_name);
  new.account_number := regexp_replace(new.account_number, '[^0-9]', '', 'g');
  new.account_holder_name := btrim(new.account_holder_name);

  if char_length(new.bank_name) < 2
     or char_length(new.account_number) < 6
     or char_length(new.account_holder_name) < 2 then
    raise exception 'Data rekening pembayaran tidak valid.' using errcode = '22023';
  end if;

  if new.is_default and not new.is_active then
    raise exception 'Rekening default harus aktif.' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.normalize_payment_account() from public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_normalize_payment_account ON public.payment_accounts;
create trigger trg_normalize_payment_account
before insert or update of bank_name, account_number, account_holder_name, is_active, is_default
on public.payment_accounts
for each row execute function private.normalize_payment_account();

update public.payment_accounts
set
  bank_name = btrim(bank_name),
  account_number = regexp_replace(account_number, '[^0-9]', '', 'g'),
  account_holder_name = btrim(account_holder_name);

-- A course may only reference an active payment account.
create or replace function private.ensure_course_payment_account_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.payment_accounts pa
    where pa.id = new.payment_account_id
      and pa.is_active
  ) then
    raise exception 'Course wajib menggunakan rekening pembayaran aktif.'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke all on function private.ensure_course_payment_account_active() from public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_ensure_course_payment_account_active ON public.courses;
create trigger trg_ensure_course_payment_account_active
before insert or update of payment_account_id
on public.courses
for each row execute function private.ensure_course_payment_account_active();

-- Student-safe current account lookup for a specific owned enrollment.
create or replace function public.get_enrollment_payment_account(
  target_enrollment_id uuid
)
returns table (
  payment_account_id uuid,
  bank_name text,
  account_number text,
  account_holder_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_active_admin()
     and not exists (
       select 1
       from public.enrollments e
       where e.id = target_enrollment_id
         and e.profile_id = (select auth.uid())
         and e.status in (
           'pending_payment'::public.enrollment_status,
           'pending_approval'::public.enrollment_status
         )
     ) then
    raise exception 'Enrollment pembayaran tidak ditemukan atau tidak dapat diakses.'
      using errcode = '42501';
  end if;

  return query
  select
    pa.id,
    pa.bank_name::text,
    pa.account_number::text,
    pa.account_holder_name::text
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  join public.payment_accounts pa on pa.id = c.payment_account_id
  where e.id = target_enrollment_id
    and pa.is_active;
end;
$$;

-- Admin-only course assignment RPC.
create or replace function public.set_course_payment_account(
  target_course_id uuid,
  target_payment_account_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_active_admin() then
    raise exception 'Hanya Admin aktif yang dapat mengatur rekening course.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.payment_accounts pa
    where pa.id = target_payment_account_id
      and pa.is_active
  ) then
    raise exception 'Rekening pembayaran aktif tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  update public.courses
  set payment_account_id = target_payment_account_id,
      updated_at = now()
  where id = target_course_id;

  if not found then
    raise exception 'Course tidak ditemukan.' using errcode = 'P0002';
  end if;
end;
$$;

-- Admin-only default-account RPC avoids partial-unique conflicts.
create or replace function public.set_default_payment_account(
  target_payment_account_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_active_admin() then
    raise exception 'Hanya Admin aktif yang dapat mengatur rekening default.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.payment_accounts pa
    where pa.id = target_payment_account_id
      and pa.is_active
  ) then
    raise exception 'Rekening pembayaran aktif tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  update public.payment_accounts
  set is_default = false
  where is_default
    and id <> target_payment_account_id;

  update public.payment_accounts
  set is_default = true,
      is_active = true
  where id = target_payment_account_id;
end;
$$;

revoke all on function public.get_enrollment_payment_account(uuid) from public, anon;
revoke all on function public.set_course_payment_account(uuid, uuid) from public, anon;
revoke all on function public.set_default_payment_account(uuid) from public, anon;
grant execute on function public.get_enrollment_payment_account(uuid) to authenticated;
grant execute on function public.set_course_payment_account(uuid, uuid) to authenticated;
grant execute on function public.set_default_payment_account(uuid) to authenticated;

-- Students only need the current account while their own enrollment is awaiting payment/review.
drop policy if exists payment_accounts_select_authorized on public.payment_accounts;
create policy payment_accounts_select_authorized
on public.payment_accounts
for select
to authenticated
using (
  (select private.is_active_admin())
  or (
    is_active
    and exists (
      select 1
      from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.profile_id = (select auth.uid())
        and e.status in (
          'pending_payment'::public.enrollment_status,
          'pending_approval'::public.enrollment_status
        )
        and c.payment_account_id = payment_accounts.id
    )
  )
);

-- Explicitly keep account management unavailable to anonymous callers and Mentors.
revoke all on table public.payment_accounts from anon;
revoke truncate, references, trigger on table public.payment_accounts from authenticated;

-- Supporting indexes for payment lookup and owner/course policies.
create index if not exists idx_payments_account_created_at
on public.payments(payment_account_id, created_at desc);

create index if not exists idx_enrollments_profile_status_course
on public.enrollments(profile_id, status, course_id);

create index if not exists idx_tryouts_creator_course
on public.tryouts(created_by, course_id);

create index if not exists idx_lesson_message_threads_course_student
on public.lesson_message_threads(course_id, student_profile_id);

-- Security-definer payment functions use a fixed empty search path.
do $$
declare
  fn record;
begin
  for fn in
    select n.nspname as schema_name,
           p.proname,
           pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.proname in (
        'set_payment_account_snapshot',
        'guard_student_payment_update',
        'normalize_payment_account',
        'ensure_course_payment_account_active',
        'get_enrollment_payment_account',
        'set_course_payment_account',
        'set_default_payment_account'
      )
      and p.prosecdef
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = ''''',
      fn.schema_name,
      fn.proname,
      fn.identity_args
    );
  end loop;
end;
$$;
