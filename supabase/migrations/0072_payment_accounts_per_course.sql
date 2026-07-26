begin;

create table public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  label varchar(120) not null check (char_length(btrim(label)) between 1 and 120),
  bank_name varchar(80) not null check (char_length(btrim(bank_name)) between 1 and 80),
  account_number varchar(80) not null check (char_length(btrim(account_number)) between 1 and 80),
  account_holder_name varchar(160) not null check (char_length(btrim(account_holder_name)) between 1 and 160),
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_payment_accounts_default_active check (not is_default or is_active)
);

create unique index uq_payment_accounts_default
  on public.payment_accounts(is_default)
  where is_default;
create index idx_payment_accounts_active_label
  on public.payment_accounts(is_active, label);
create unique index uq_payment_accounts_bank_number
  on public.payment_accounts(lower(bank_name), account_number);

create trigger trg_payment_accounts_updated_at
before update on public.payment_accounts
for each row execute function public.update_updated_at_column();

insert into public.payment_accounts (
  label,
  bank_name,
  account_number,
  account_holder_name,
  is_active,
  is_default
) values (
  'BRI Gangsar',
  'BRI',
  '002101148799501',
  'Gangsar Lintas Damai',
  true,
  true
);

alter table public.courses
  add column payment_account_id uuid;

update public.courses
set payment_account_id = (
  select id from public.payment_accounts where is_default limit 1
)
where payment_account_id is null;

alter table public.courses
  alter column payment_account_id set not null,
  add constraint fk_courses_payment_account
    foreign key (payment_account_id)
    references public.payment_accounts(id)
    on delete restrict;

create index idx_courses_payment_account
  on public.courses(payment_account_id);

alter table public.payments
  add column payment_account_id uuid,
  add column bank_name_snapshot varchar(80),
  add column account_number_snapshot varchar(80),
  add column account_holder_name_snapshot varchar(160),
  add column payment_account_label_snapshot varchar(120);

update public.payments p
set
  payment_account_id = pa.id,
  bank_name_snapshot = pa.bank_name,
  account_number_snapshot = pa.account_number,
  account_holder_name_snapshot = pa.account_holder_name,
  payment_account_label_snapshot = pa.label
from public.enrollments e
join public.courses c on c.id = e.course_id
join public.payment_accounts pa on pa.id = c.payment_account_id
where p.enrollment_id = e.id;

alter table public.payments
  alter column payment_account_id set not null,
  alter column bank_name_snapshot set not null,
  alter column account_number_snapshot set not null,
  alter column account_holder_name_snapshot set not null,
  alter column payment_account_label_snapshot set not null,
  add constraint fk_payments_payment_account
    foreign key (payment_account_id)
    references public.payment_accounts(id)
    on delete restrict;

create index idx_payments_payment_account
  on public.payments(payment_account_id);

create or replace function public.assign_default_payment_account_to_course()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_account_id is null then
    select pa.id into new.payment_account_id
    from public.payment_accounts pa
    where pa.is_default and pa.is_active
    limit 1;
  end if;

  if new.payment_account_id is null then
    raise exception 'Rekening pembayaran default belum tersedia.';
  end if;

  if not exists (
    select 1 from public.payment_accounts pa
    where pa.id = new.payment_account_id and pa.is_active
  ) then
    raise exception 'Rekening pembayaran course tidak aktif.';
  end if;

  return new;
end;
$$;

create trigger trg_courses_assign_payment_account
before insert or update of payment_account_id on public.courses
for each row execute function public.assign_default_payment_account_to_course();

create or replace function public.snapshot_payment_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_row public.payment_accounts%rowtype;
begin
  select pa.* into account_row
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  join public.payment_accounts pa on pa.id = c.payment_account_id
  where e.id = new.enrollment_id;

  if not found then
    raise exception 'Rekening pembayaran course tidak ditemukan.';
  end if;

  new.payment_account_id := account_row.id;
  new.bank_name_snapshot := account_row.bank_name;
  new.account_number_snapshot := account_row.account_number;
  new.account_holder_name_snapshot := account_row.account_holder_name;
  new.payment_account_label_snapshot := account_row.label;
  return new;
end;
$$;

create trigger trg_payments_snapshot_account
before insert on public.payments
for each row execute function public.snapshot_payment_account();

create or replace function public.preserve_payment_account_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.payment_account_id := old.payment_account_id;
  new.bank_name_snapshot := old.bank_name_snapshot;
  new.account_number_snapshot := old.account_number_snapshot;
  new.account_holder_name_snapshot := old.account_holder_name_snapshot;
  new.payment_account_label_snapshot := old.payment_account_label_snapshot;
  return new;
end;
$$;

create trigger trg_payments_preserve_account_snapshot
before update on public.payments
for each row execute function public.preserve_payment_account_snapshot();

create or replace function public.guard_payment_account_deactivation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_active and not new.is_active and exists (
    select 1 from public.courses c where c.payment_account_id = old.id
  ) then
    raise exception 'Rekening masih digunakan oleh course. Pindahkan course ke rekening lain terlebih dahulu.';
  end if;
  return new;
end;
$$;

create trigger trg_guard_payment_account_deactivation
before update of is_active on public.payment_accounts
for each row execute function public.guard_payment_account_deactivation();

create or replace function public.admin_set_default_payment_account(target_account_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select public.current_profile_role()) <> 'admin' then
    raise exception 'Akses Admin diperlukan.';
  end if;

  if not exists (
    select 1 from public.payment_accounts
    where id = target_account_id and is_active
  ) then
    raise exception 'Rekening aktif tidak ditemukan.';
  end if;

  update public.payment_accounts set is_default = false where is_default;
  update public.payment_accounts set is_default = true where id = target_account_id;
  return target_account_id;
end;
$$;

revoke all on function public.assign_default_payment_account_to_course() from public;
revoke all on function public.snapshot_payment_account() from public;
revoke all on function public.guard_payment_account_deactivation() from public;
revoke all on function public.preserve_payment_account_snapshot() from public;
revoke all on function public.admin_set_default_payment_account(uuid) from public;
grant execute on function public.admin_set_default_payment_account(uuid) to authenticated;

alter table public.payment_accounts enable row level security;

create policy payment_accounts_select
on public.payment_accounts
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    is_active
    and exists (
      select 1
      from public.courses c
      join public.enrollments e on e.course_id = c.id
      where c.payment_account_id = payment_accounts.id
        and e.profile_id = (select auth.uid())
    )
  )
);

create policy payment_accounts_admin_insert
on public.payment_accounts
for insert to authenticated
with check ((select public.current_profile_role()) = 'admin');

create policy payment_accounts_admin_update
on public.payment_accounts
for update to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

revoke all privileges on table public.payment_accounts from anon, authenticated;
grant select, insert, update on table public.payment_accounts to authenticated;

commit;
