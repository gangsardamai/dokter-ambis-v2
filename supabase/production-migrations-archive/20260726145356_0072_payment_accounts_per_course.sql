-- Archived from production migration history.
-- Production version: 20260726145356
-- Production name: 0072_payment_accounts_per_course
-- Intentionally stored outside supabase/migrations so migration tooling does not replay it.

-- 0072: centrally managed payment accounts assigned per course with immutable payment snapshots

create table if not exists public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name varchar(100) not null,
  account_number varchar(80) not null,
  account_holder_name varchar(180) not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_payment_accounts_bank_name
    check (char_length(btrim(bank_name)) between 2 and 100),
  constraint chk_payment_accounts_account_number
    check (char_length(regexp_replace(account_number, '[^0-9]', '', 'g')) between 6 and 40),
  constraint chk_payment_accounts_holder_name
    check (char_length(btrim(account_holder_name)) between 2 and 180),
  constraint chk_payment_accounts_default_active
    check (not is_default or is_active)
);

create unique index if not exists uq_payment_accounts_bank_number
on public.payment_accounts (
  lower(btrim(bank_name)),
  regexp_replace(account_number, '[^0-9]', '', 'g')
);

create unique index if not exists uq_payment_accounts_single_default
on public.payment_accounts (is_default)
where is_default;

create index if not exists idx_payment_accounts_active_default
on public.payment_accounts (is_active, is_default);

DROP TRIGGER IF EXISTS trg_payment_accounts_updated_at ON public.payment_accounts;
create trigger trg_payment_accounts_updated_at
before update on public.payment_accounts
for each row execute function public.update_updated_at_column();

-- Seed the approved default account and make it the sole default.
do $$
declare
  default_account_id uuid;
begin
  select pa.id
  into default_account_id
  from public.payment_accounts pa
  where lower(btrim(pa.bank_name)) = 'bri'
    and regexp_replace(pa.account_number, '[^0-9]', '', 'g') = '002101148799501'
  limit 1;

  if default_account_id is null then
    insert into public.payment_accounts (
      bank_name,
      account_number,
      account_holder_name,
      is_active,
      is_default
    ) values (
      'BRI',
      '002101148799501',
      'Gangsar Lintas Damai',
      true,
      false
    )
    returning id into default_account_id;
  else
    update public.payment_accounts
    set
      bank_name = 'BRI',
      account_number = '002101148799501',
      account_holder_name = 'Gangsar Lintas Damai',
      is_active = true
    where id = default_account_id;
  end if;

  update public.payment_accounts
  set is_default = false
  where is_default
    and id <> default_account_id;

  update public.payment_accounts
  set is_default = true,
      is_active = true
  where id = default_account_id;
end;
$$;

alter table public.courses
  add column if not exists payment_account_id uuid;

alter table public.courses
  drop constraint if exists fk_courses_payment_account;

alter table public.courses
  add constraint fk_courses_payment_account
  foreign key (payment_account_id)
  references public.payment_accounts(id)
  on delete restrict;

update public.courses c
set payment_account_id = pa.id
from public.payment_accounts pa
where c.payment_account_id is null
  and pa.is_default;

alter table public.courses
  alter column payment_account_id set not null;

create index if not exists idx_courses_payment_account
on public.courses(payment_account_id);

alter table public.payments
  add column if not exists payment_account_id uuid,
  add column if not exists bank_name_snapshot varchar(100),
  add column if not exists account_number_snapshot varchar(80),
  add column if not exists account_holder_name_snapshot varchar(180);

alter table public.payments
  drop constraint if exists fk_payments_payment_account;

alter table public.payments
  add constraint fk_payments_payment_account
  foreign key (payment_account_id)
  references public.payment_accounts(id)
  on delete restrict;

-- Backfill every historical payment, including free payments, for a complete audit trail.
update public.payments p
set
  payment_account_id = pa.id,
  bank_name_snapshot = pa.bank_name,
  account_number_snapshot = pa.account_number,
  account_holder_name_snapshot = pa.account_holder_name
from public.enrollments e
join public.courses c on c.id = e.course_id
join public.payment_accounts pa on pa.id = c.payment_account_id
where p.enrollment_id = e.id
  and (
    p.payment_account_id is null
    or p.bank_name_snapshot is null
    or p.account_number_snapshot is null
    or p.account_holder_name_snapshot is null
  );

alter table public.payments
  alter column payment_account_id set not null,
  alter column bank_name_snapshot set not null,
  alter column account_number_snapshot set not null,
  alter column account_holder_name_snapshot set not null;

alter table public.payments
  drop constraint if exists chk_payments_bank_name_snapshot;
alter table public.payments
  add constraint chk_payments_bank_name_snapshot
  check (char_length(btrim(bank_name_snapshot)) between 2 and 100);

alter table public.payments
  drop constraint if exists chk_payments_account_number_snapshot;
alter table public.payments
  add constraint chk_payments_account_number_snapshot
  check (char_length(regexp_replace(account_number_snapshot, '[^0-9]', '', 'g')) between 6 and 40);

alter table public.payments
  drop constraint if exists chk_payments_holder_name_snapshot;
alter table public.payments
  add constraint chk_payments_holder_name_snapshot
  check (char_length(btrim(account_holder_name_snapshot)) between 2 and 180);

create index if not exists idx_payments_payment_account
on public.payments(payment_account_id);

-- New payments always inherit the current course account; snapshots are immutable afterwards.
create or replace function private.set_payment_account_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_account public.payment_accounts%rowtype;
begin
  if tg_op = 'UPDATE' then
    if new.enrollment_id is distinct from old.enrollment_id
       or new.payment_account_id is distinct from old.payment_account_id
       or new.bank_name_snapshot is distinct from old.bank_name_snapshot
       or new.account_number_snapshot is distinct from old.account_number_snapshot
       or new.account_holder_name_snapshot is distinct from old.account_holder_name_snapshot then
      raise exception 'Identitas enrollment dan snapshot rekening pembayaran tidak dapat diubah.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  select pa.*
  into target_account
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  join public.payment_accounts pa on pa.id = c.payment_account_id
  where e.id = new.enrollment_id
    and pa.is_active;

  if not found then
    raise exception 'Rekening aktif untuk course pembayaran tidak tersedia.'
      using errcode = 'P0002';
  end if;

  new.payment_account_id := target_account.id;
  new.bank_name_snapshot := target_account.bank_name;
  new.account_number_snapshot := target_account.account_number;
  new.account_holder_name_snapshot := target_account.account_holder_name;

  return new;
end;
$$;

revoke all on function private.set_payment_account_snapshot() from public;

DROP TRIGGER IF EXISTS trg_set_payment_account_snapshot ON public.payments;
create trigger trg_set_payment_account_snapshot
before insert or update of enrollment_id, payment_account_id,
  bank_name_snapshot, account_number_snapshot, account_holder_name_snapshot
on public.payments
for each row execute function private.set_payment_account_snapshot();

-- Keep payment account snapshots outside participant-controlled fields.
create or replace function private.guard_student_payment_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_active_admin() then
    return new;
  end if;

  if (select auth.uid()) is null
     or not exists (
       select 1
       from public.enrollments e
       where e.id = old.enrollment_id
         and e.profile_id = (select auth.uid())
     ) then
    raise exception 'Pembayaran hanya dapat diubah oleh pemilik atau admin.'
      using errcode = '42501';
  end if;

  if old.status not in (
       'pending'::public.payment_status,
       'rejected'::public.payment_status
     )
     or new.status <> 'pending'::public.payment_status then
    raise exception 'Perubahan status pembayaran tidak diizinkan.'
      using errcode = '42501';
  end if;

  if new.id is distinct from old.id
     or new.enrollment_id is distinct from old.enrollment_id
     or new.created_at is distinct from old.created_at
     or new.payment_account_id is distinct from old.payment_account_id
     or new.bank_name_snapshot is distinct from old.bank_name_snapshot
     or new.account_number_snapshot is distinct from old.account_number_snapshot
     or new.account_holder_name_snapshot is distinct from old.account_holder_name_snapshot then
    raise exception 'Identitas pembayaran dan snapshot rekening tidak boleh diubah peserta.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_student_payment_update() from public;

alter table public.payment_accounts enable row level security;

-- Admin manages all accounts. Students may read only the account assigned to one of their enrollments.
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
        and c.payment_account_id = payment_accounts.id
    )
  )
);

drop policy if exists payment_accounts_admin_insert on public.payment_accounts;
create policy payment_accounts_admin_insert
on public.payment_accounts
for insert
to authenticated
with check ((select private.is_active_admin()));

drop policy if exists payment_accounts_admin_update on public.payment_accounts;
create policy payment_accounts_admin_update
on public.payment_accounts
for update
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

drop policy if exists payment_accounts_admin_delete on public.payment_accounts;
create policy payment_accounts_admin_delete
on public.payment_accounts
for delete
to authenticated
using ((select private.is_active_admin()));

revoke all on table public.payment_accounts from anon;
revoke all on table public.payment_accounts from authenticated;
grant select, insert, update, delete on table public.payment_accounts to authenticated;
