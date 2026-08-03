begin;

-- Remove the unused privileged account lookup RPC. The application reads the
-- account through RLS-bound table access instead.
drop function if exists public.get_enrollment_payment_account(uuid);

-- A deferred participant may only see the payment account after the enrollment
-- is active. Upfront participants retain the existing checkout access.
drop policy if exists payment_accounts_select_authorized
  on public.payment_accounts;
create policy payment_accounts_select_authorized
on public.payment_accounts
for select
to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.is_active_student())
    and is_active
    and exists (
      select 1
      from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.profile_id = (select auth.uid())
        and c.payment_account_id = payment_accounts.id
        and (
          (
            e.payment_timing = 'upfront'::public.payment_timing
            and e.status in (
              'pending_payment'::public.enrollment_status,
              'pending_approval'::public.enrollment_status
            )
          )
          or (
            e.payment_timing = 'deferred'::public.payment_timing
            and e.status = 'active'::public.enrollment_status
          )
        )
    )
  )
);

-- Direct table writes are kept as defense in depth, while the application uses
-- student_submit_payment() for an atomic payment + enrollment transition.
drop policy if exists payments_student_insert on public.payments;
create policy payments_student_insert
on public.payments
for insert
to authenticated
with check (
  (select private.is_active_student())
  and status = 'pending'::public.payment_status
  and payment_method = 'bank_transfer'::public.payment_method
  and payment_proof_path is not null
  and paid_at is not null
  and verified_at is null
  and verified_by is null
  and notes is null
  and exists (
    select 1
    from public.enrollments e
    where e.id = payments.enrollment_id
      and e.profile_id = (select auth.uid())
      and payments.amount = greatest(
        e.price_snapshot - e.discount_amount,
        0::numeric
      )
      and (
        (
          e.payment_timing = 'upfront'::public.payment_timing
          and e.status = 'pending_payment'::public.enrollment_status
        )
        or (
          e.payment_timing = 'deferred'::public.payment_timing
          and e.status = 'active'::public.enrollment_status
        )
      )
  )
);

drop policy if exists payments_update_authorized on public.payments;
create policy payments_update_authorized
on public.payments
for update
to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.is_active_student())
    and status = 'rejected'::public.payment_status
    and exists (
      select 1
      from public.enrollments e
      where e.id = payments.enrollment_id
        and e.profile_id = (select auth.uid())
    )
  )
)
with check (
  (select private.is_active_admin())
  or (
    (select private.is_active_student())
    and status = 'pending'::public.payment_status
    and payment_method = 'bank_transfer'::public.payment_method
    and payment_proof_path is not null
    and paid_at is not null
    and verified_at is null
    and verified_by is null
    and notes is null
    and exists (
      select 1
      from public.enrollments e
      where e.id = payments.enrollment_id
        and e.profile_id = (select auth.uid())
        and payments.amount = greatest(
          e.price_snapshot - e.discount_amount,
          0::numeric
        )
        and (
          (
            e.payment_timing = 'upfront'::public.payment_timing
            and e.status = 'pending_payment'::public.enrollment_status
          )
          or (
            e.payment_timing = 'deferred'::public.payment_timing
            and e.status = 'active'::public.enrollment_status
          )
        )
    )
  )
);

-- Students can only replace a rejected payment. A pending proof cannot be
-- silently replaced while an admin is reviewing it.
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

  if old.status <> 'rejected'::public.payment_status
     or new.status <> 'pending'::public.payment_status then
    raise exception 'Hanya pembayaran yang ditolak yang dapat dikirim ulang.'
      using errcode = '42501';
  end if;

  if new.id is distinct from old.id
     or new.enrollment_id is distinct from old.enrollment_id
     or new.created_at is distinct from old.created_at
     or new.payment_account_id is distinct from old.payment_account_id
     or new.bank_name_snapshot is distinct from old.bank_name_snapshot
     or new.account_number_snapshot is distinct from old.account_number_snapshot
     or new.account_holder_name_snapshot is distinct from old.account_holder_name_snapshot
     or new.payment_account_label_snapshot is distinct from old.payment_account_label_snapshot then
    raise exception 'Identitas pembayaran dan snapshot rekening tidak boleh diubah peserta.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Submit or resubmit a payment and update the upfront enrollment status in one
-- database transaction. Storage upload happens before this RPC; a database
-- failure therefore cannot create a partially transitioned enrollment.
create or replace function public.student_submit_payment(
  target_enrollment_id uuid,
  target_amount numeric,
  target_payment_proof_path text
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile_id uuid := (select auth.uid());
  enrollment_record public.enrollments%rowtype;
  payment_record public.payments%rowtype;
  expected_amount numeric;
begin
  if current_profile_id is null or not private.is_active_student() then
    raise exception 'Hanya peserta aktif yang dapat mengirim pembayaran.'
      using errcode = '42501';
  end if;

  if target_payment_proof_path is null
     or btrim(target_payment_proof_path) = '' then
    raise exception 'Bukti pembayaran wajib diisi.' using errcode = '22023';
  end if;

  select *
  into enrollment_record
  from public.enrollments
  where id = target_enrollment_id
    and profile_id = current_profile_id
  for update;

  if not found then
    raise exception 'Enrollment tidak ditemukan.' using errcode = 'P0002';
  end if;

  if not (
    (
      enrollment_record.payment_timing = 'upfront'::public.payment_timing
      and enrollment_record.status = 'pending_payment'::public.enrollment_status
    )
    or (
      enrollment_record.payment_timing = 'deferred'::public.payment_timing
      and enrollment_record.status = 'active'::public.enrollment_status
    )
  ) then
    raise exception 'Enrollment ini belum dapat menerima pembayaran.'
      using errcode = '22023';
  end if;

  expected_amount := greatest(
    enrollment_record.price_snapshot - enrollment_record.discount_amount,
    0::numeric
  );

  if expected_amount <= 0 then
    raise exception 'Gunakan alur pembayaran Rp0 untuk enrollment ini.'
      using errcode = '22023';
  end if;

  if target_amount is distinct from expected_amount then
    raise exception 'Nominal pembayaran tidak sesuai total enrollment.'
      using errcode = '22023';
  end if;

  select *
  into payment_record
  from public.payments
  where enrollment_id = enrollment_record.id
  for update;

  if found then
    if payment_record.status <> 'rejected'::public.payment_status then
      raise exception 'Pembayaran sedang diproses atau sudah disetujui.'
        using errcode = '22023';
    end if;

    update public.payments
    set amount = expected_amount,
        payment_method = 'bank_transfer'::public.payment_method,
        payment_proof_path = btrim(target_payment_proof_path),
        status = 'pending'::public.payment_status,
        paid_at = now(),
        verified_at = null,
        verified_by = null,
        notes = null,
        updated_at = now()
    where id = payment_record.id
    returning * into payment_record;
  else
    insert into public.payments (
      enrollment_id,
      amount,
      payment_method,
      payment_proof_path,
      status,
      paid_at
    ) values (
      enrollment_record.id,
      expected_amount,
      'bank_transfer'::public.payment_method,
      btrim(target_payment_proof_path),
      'pending'::public.payment_status,
      now()
    )
    returning * into payment_record;
  end if;

  if enrollment_record.payment_timing = 'upfront'::public.payment_timing then
    update public.enrollments
    set status = 'pending_approval'::public.enrollment_status,
        activated_at = null,
        updated_at = now()
    where id = enrollment_record.id;
  end if;

  return payment_record;
end;
$$;

-- Review a single payment atomically with the related enrollment transition.
create or replace function public.admin_review_payment(
  target_payment_id uuid,
  target_status public.payment_status,
  rejection_notes text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_record public.payments%rowtype;
  enrollment_record public.enrollments%rowtype;
  normalized_notes text := nullif(btrim(coalesce(rejection_notes, '')), '');
begin
  if not private.is_active_admin() then
    raise exception 'Akses Admin diperlukan.' using errcode = '42501';
  end if;

  if target_status not in (
    'approved'::public.payment_status,
    'rejected'::public.payment_status
  ) then
    raise exception 'Status review pembayaran tidak valid.' using errcode = '22023';
  end if;

  select *
  into payment_record
  from public.payments
  where id = target_payment_id
  for update;

  if not found then
    raise exception 'Payment tidak ditemukan.' using errcode = 'P0002';
  end if;

  if payment_record.status <> 'pending'::public.payment_status then
    raise exception 'Hanya payment yang menunggu verifikasi yang dapat direview.'
      using errcode = '22023';
  end if;

  select *
  into enrollment_record
  from public.enrollments
  where id = payment_record.enrollment_id
  for update;

  if not found then
    raise exception 'Enrollment pembayaran tidak ditemukan.' using errcode = 'P0002';
  end if;

  update public.payments
  set status = target_status,
      verified_by = (select auth.uid()),
      verified_at = now(),
      notes = case
        when target_status = 'rejected'::public.payment_status then normalized_notes
        else null
      end,
      updated_at = now()
  where id = payment_record.id
  returning * into payment_record;

  if enrollment_record.payment_timing = 'upfront'::public.payment_timing then
    if target_status = 'approved'::public.payment_status then
      update public.enrollments
      set status = 'active'::public.enrollment_status,
          activated_at = coalesce(activated_at, now()),
          updated_at = now()
      where id = enrollment_record.id;
    else
      update public.enrollments
      set status = 'pending_payment'::public.enrollment_status,
          activated_at = null,
          updated_at = now()
      where id = enrollment_record.id;
    end if;
  end if;

  insert into public.activity_logs (
    profile_id,
    action,
    entity_type,
    entity_id,
    description
  ) values (
    (select auth.uid()),
    case
      when target_status = 'approved'::public.payment_status
        then 'approve_payment'
      else 'reject_payment'
    end,
    'payment',
    payment_record.id,
    format('Payment %s untuk enrollment %s.', target_status, enrollment_record.id)
  );

  return payment_record;
end;
$$;

-- Bulk approval uses one SQL statement for payments and one statement for all
-- related upfront enrollments within the same transaction.
create or replace function public.admin_approve_all_pending_payments()
returns setof public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved_count integer := 0;
begin
  if not private.is_active_admin() then
    raise exception 'Akses Admin diperlukan.' using errcode = '42501';
  end if;

  create temporary table if not exists pg_temp.approved_payment_rows
  on commit drop
  as select * from public.payments with no data;

  truncate table pg_temp.approved_payment_rows;

  with approved as (
    update public.payments
    set status = 'approved'::public.payment_status,
        verified_by = (select auth.uid()),
        verified_at = now(),
        notes = null,
        updated_at = now()
    where status = 'pending'::public.payment_status
    returning *
  )
  insert into pg_temp.approved_payment_rows
  select * from approved;

  get diagnostics approved_count = row_count;

  update public.enrollments e
  set status = 'active'::public.enrollment_status,
      activated_at = coalesce(e.activated_at, now()),
      updated_at = now()
  from pg_temp.approved_payment_rows p
  where e.id = p.enrollment_id
    and e.payment_timing = 'upfront'::public.payment_timing;

  if approved_count > 0 then
    insert into public.activity_logs (
      profile_id,
      action,
      entity_type,
      entity_id,
      description
    ) values (
      (select auth.uid()),
      'approve_all_payments',
      'payment',
      null,
      format('%s payment menunggu berhasil disetujui.', approved_count)
    );
  end if;

  return query
  select *
  from pg_temp.approved_payment_rows
  order by created_at;
end;
$$;

-- Changing timing also normalizes enrollment access according to the current
-- payment state, preventing active unpaid upfront enrollments.
create or replace function public.admin_update_enrollment_payment_timing(
  target_enrollment_id uuid,
  target_payment_timing public.payment_timing
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  enrollment_record public.enrollments%rowtype;
  current_payment_status public.payment_status;
  next_status public.enrollment_status;
  next_activated_at timestamptz;
begin
  if not private.is_active_admin() then
    raise exception 'Akses Admin diperlukan.' using errcode = '42501';
  end if;

  select *
  into enrollment_record
  from public.enrollments
  where id = target_enrollment_id
  for update;

  if not found then
    raise exception 'Enrollment tidak ditemukan.' using errcode = 'P0002';
  end if;

  if enrollment_record.status in (
    'cancelled'::public.enrollment_status,
    'expired'::public.enrollment_status
  ) then
    raise exception 'Kategori pembayaran enrollment yang sudah berakhir tidak dapat diubah.'
      using errcode = '22023';
  end if;

  if enrollment_record.payment_timing = target_payment_timing then
    return;
  end if;

  if target_payment_timing = 'deferred'::public.payment_timing
     and not exists (
       select 1
       from public.courses c
       where c.id = enrollment_record.course_id
         and c.payment_policy = 'upfront_or_deferred'::public.payment_policy
     ) then
    raise exception 'Course ini tidak menyediakan pembayaran di akhir.'
      using errcode = '22023';
  end if;

  select p.status
  into current_payment_status
  from public.payments p
  where p.enrollment_id = enrollment_record.id;

  if target_payment_timing = 'deferred'::public.payment_timing then
    if enrollment_record.status = 'active'::public.enrollment_status
       or current_payment_status = 'approved'::public.payment_status then
      next_status := 'active'::public.enrollment_status;
      next_activated_at := coalesce(enrollment_record.activated_at, now());
    else
      next_status := 'pending_approval'::public.enrollment_status;
      next_activated_at := null;
    end if;
  else
    if current_payment_status = 'approved'::public.payment_status then
      next_status := 'active'::public.enrollment_status;
      next_activated_at := coalesce(enrollment_record.activated_at, now());
    elsif current_payment_status = 'pending'::public.payment_status then
      next_status := 'pending_approval'::public.enrollment_status;
      next_activated_at := null;
    else
      next_status := 'pending_payment'::public.enrollment_status;
      next_activated_at := null;
    end if;
  end if;

  update public.enrollments
  set payment_timing = target_payment_timing,
      status = next_status,
      activated_at = next_activated_at,
      updated_at = now()
  where id = enrollment_record.id;

  insert into public.activity_logs (
    profile_id,
    action,
    entity_type,
    entity_id,
    description
  ) values (
    (select auth.uid()),
    'update_payment_timing',
    'enrollment',
    enrollment_record.id,
    format(
      'Payment timing diubah dari %s menjadi %s; status enrollment %s menjadi %s.',
      enrollment_record.payment_timing,
      target_payment_timing,
      enrollment_record.status,
      next_status
    )
  );
end;
$$;

revoke all on function public.student_submit_payment(uuid, numeric, text)
  from public, anon;
grant execute on function public.student_submit_payment(uuid, numeric, text)
  to authenticated;

revoke all on function public.admin_review_payment(uuid, public.payment_status, text)
  from public, anon;
grant execute on function public.admin_review_payment(uuid, public.payment_status, text)
  to authenticated;

revoke all on function public.admin_approve_all_pending_payments()
  from public, anon;
grant execute on function public.admin_approve_all_pending_payments()
  to authenticated;

revoke all on function public.admin_update_enrollment_payment_timing(uuid, public.payment_timing)
  from public, anon;
grant execute on function public.admin_update_enrollment_payment_timing(uuid, public.payment_timing)
  to authenticated;

commit;
