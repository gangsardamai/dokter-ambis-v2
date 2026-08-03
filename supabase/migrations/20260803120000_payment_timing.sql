begin;

-- Course-level policy and enrollment-level snapshot.
do $$
begin
  create type public.payment_policy as enum (
    'upfront_only',
    'upfront_or_deferred'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_timing as enum (
    'upfront',
    'deferred'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.courses
  add column if not exists payment_policy public.payment_policy;

update public.courses
set payment_policy = 'upfront_only'::public.payment_policy
where payment_policy is null;

alter table public.courses
  alter column payment_policy set default 'upfront_only'::public.payment_policy,
  alter column payment_policy set not null;

alter table public.enrollments
  add column if not exists payment_timing public.payment_timing;

update public.enrollments
set payment_timing = 'upfront'::public.payment_timing
where payment_timing is null;

alter table public.enrollments
  alter column payment_timing set default 'upfront'::public.payment_timing,
  alter column payment_timing set not null;

create index if not exists idx_courses_payment_policy
  on public.courses(payment_policy);

create index if not exists idx_enrollments_payment_timing_created
  on public.enrollments(payment_timing, created_at desc);

-- A deferred enrollment can only be newly selected for a course that permits it.
create or replace function private.validate_enrollment_payment_timing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.payment_timing = 'deferred'::public.payment_timing
     and not exists (
       select 1
       from public.courses c
       where c.id = new.course_id
         and c.payment_policy = 'upfront_or_deferred'::public.payment_policy
     ) then
    raise exception 'Course ini tidak menyediakan pembayaran di akhir.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_enrollment_payment_timing
  on public.enrollments;

create trigger trg_validate_enrollment_payment_timing
before insert or update of course_id, payment_timing
on public.enrollments
for each row
execute function private.validate_enrollment_payment_timing();

revoke all on function private.validate_enrollment_payment_timing() from public;

-- Keep the new snapshot field protected from participant-side updates.
create or replace function private.guard_student_enrollment_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
$$;

-- Allow students to create either the legacy upfront enrollment or a deferred
-- request that starts in pending_approval.
drop policy if exists enrollments_student_insert on public.enrollments;
create policy enrollments_student_insert
on public.enrollments
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and (select private.is_active_student())
  and category = 'regular'::public.enrollment_category
  and discount_amount = 0
  and promotion_id is null
  and promotion_code_snapshot is null
  and promotion_name_snapshot is null
  and activated_at is null
  and expired_at is null
  and exists (
    select 1
    from public.courses c
    where c.id = enrollments.course_id
      and c.status = 'active'::public.course_status
      and enrollments.price_snapshot = case
        when c.is_free then 0::numeric
        else c.price
      end
      and (
        (
          enrollments.payment_timing = 'upfront'::public.payment_timing
          and enrollments.status = 'pending_payment'::public.enrollment_status
        )
        or (
          enrollments.payment_timing = 'deferred'::public.payment_timing
          and enrollments.status = 'pending_approval'::public.enrollment_status
          and c.payment_policy = 'upfront_or_deferred'::public.payment_policy
        )
      )
  )
);

-- Deferred active students may read the assigned account and submit payment.
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
          e.status in (
            'pending_payment'::public.enrollment_status,
            'pending_approval'::public.enrollment_status
          )
          or (
            e.status = 'active'::public.enrollment_status
            and e.payment_timing = 'deferred'::public.payment_timing
          )
        )
    )
  )
);

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
        e.status in (
          'pending_payment'::public.enrollment_status,
          'pending_approval'::public.enrollment_status
        )
        or (
          e.status = 'active'::public.enrollment_status
          and e.payment_timing = 'deferred'::public.payment_timing
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
    and status in (
      'pending'::public.payment_status,
      'rejected'::public.payment_status
    )
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
          e.status in (
            'pending_payment'::public.enrollment_status,
            'pending_approval'::public.enrollment_status
          )
          or (
            e.status = 'active'::public.enrollment_status
            and e.payment_timing = 'deferred'::public.payment_timing
          )
        )
    )
  )
);

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
     and not (
       private.is_active_student()
       and exists (
         select 1
         from public.enrollments e
         where e.id = target_enrollment_id
           and e.profile_id = (select auth.uid())
           and (
             e.status in (
               'pending_payment'::public.enrollment_status,
               'pending_approval'::public.enrollment_status
             )
             or (
               e.status = 'active'::public.enrollment_status
               and e.payment_timing = 'deferred'::public.payment_timing
             )
           )
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

-- Admin timing changes are atomic and leave an audit trail.
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
  old_timing public.payment_timing;
  target_course_id uuid;
begin
  if not private.is_active_admin() then
    raise exception 'Akses Admin diperlukan.' using errcode = '42501';
  end if;

  select e.payment_timing, e.course_id
  into old_timing, target_course_id
  from public.enrollments e
  where e.id = target_enrollment_id
  for update;

  if not found then
    raise exception 'Enrollment tidak ditemukan.' using errcode = 'P0002';
  end if;

  if target_payment_timing = 'deferred'::public.payment_timing
     and not exists (
       select 1
       from public.courses c
       where c.id = target_course_id
         and c.payment_policy = 'upfront_or_deferred'::public.payment_policy
     ) then
    raise exception 'Course ini tidak menyediakan pembayaran di akhir.'
      using errcode = '22023';
  end if;

  if old_timing = target_payment_timing then
    return;
  end if;

  update public.enrollments
  set payment_timing = target_payment_timing,
      updated_at = now()
  where id = target_enrollment_id;

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
    target_enrollment_id,
    format('Payment timing diubah dari %s menjadi %s.', old_timing, target_payment_timing)
  );
end;
$$;

-- Deferred students apply vouchers only after enrollment is active and before
-- a payment is waiting for review or has been approved.
create or replace function public.apply_deferred_promotion_code(
  target_enrollment_id uuid,
  submitted_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile_id uuid := (select auth.uid());
  normalized_code text := upper(btrim(coalesce(submitted_code, '')));
  enrollment_record public.enrollments%rowtype;
  promotion_record public.promotions%rowtype;
  active_usage_count integer := 0;
  profile_usage_count integer := 0;
  calculated_discount numeric := 0;
  final_amount numeric := 0;
begin
  if current_profile_id is null then
    raise exception 'Silakan masuk terlebih dahulu.' using errcode = '42501';
  end if;

  if not private.is_active_student() then
    raise exception 'Hanya peserta aktif yang dapat memakai kode promosi.'
      using errcode = '42501';
  end if;

  if normalized_code = '' then
    raise exception 'Kode promosi wajib diisi.' using errcode = '22023';
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

  if enrollment_record.payment_timing <> 'deferred'::public.payment_timing
     or enrollment_record.status <> 'active'::public.enrollment_status then
    raise exception 'Kode promosi pembayaran akhir hanya tersedia pada enrollment aktif.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.payments p
    where p.enrollment_id = enrollment_record.id
      and p.status in (
        'pending'::public.payment_status,
        'approved'::public.payment_status
      )
  ) then
    raise exception 'Kode promosi tidak dapat diubah setelah pembayaran dikirim.'
      using errcode = '22023';
  end if;

  select *
  into promotion_record
  from public.promotions
  where code is not null
    and upper(btrim(code)) = normalized_code
  order by priority asc, created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'Kode promosi tidak ditemukan.' using errcode = 'P0002';
  end if;

  if promotion_record.status <> 'active'::public.promotion_status then
    raise exception 'Kode promosi sedang tidak aktif.' using errcode = '22023';
  end if;

  if promotion_record.start_at > now() then
    raise exception 'Kode promosi belum dapat digunakan.' using errcode = '22023';
  end if;

  if promotion_record.end_at is not null
     and promotion_record.end_at < now() then
    raise exception 'Kode promosi sudah berakhir.' using errcode = '22023';
  end if;

  if promotion_record.course_id is not null
     and promotion_record.course_id <> enrollment_record.course_id then
    raise exception 'Kode promosi tidak berlaku untuk course ini.'
      using errcode = '22023';
  end if;

  if enrollment_record.price_snapshot < coalesce(promotion_record.minimum_purchase, 0) then
    raise exception 'Harga course belum memenuhi minimum transaksi promosi.'
      using errcode = '22023';
  end if;

  select count(*)::integer
  into active_usage_count
  from public.enrollments
  where promotion_id = promotion_record.id
    and id <> enrollment_record.id
    and status not in (
      'cancelled'::public.enrollment_status,
      'expired'::public.enrollment_status
    );

  if promotion_record.quota is not null
     and greatest(promotion_record.used_count, active_usage_count) >= promotion_record.quota then
    raise exception 'Kuota kode promosi sudah habis.' using errcode = '22023';
  end if;

  select count(*)::integer
  into profile_usage_count
  from public.enrollments
  where promotion_id = promotion_record.id
    and profile_id = current_profile_id
    and id <> enrollment_record.id
    and status not in (
      'cancelled'::public.enrollment_status,
      'expired'::public.enrollment_status
    );

  if profile_usage_count >= promotion_record.usage_per_user then
    raise exception 'Batas penggunaan kode promosi untuk akun ini sudah tercapai.'
      using errcode = '22023';
  end if;

  calculated_discount := case promotion_record.type
    when 'percentage'::public.promotion_type then
      round(enrollment_record.price_snapshot * promotion_record.value / 100, 2)
    when 'fixed_amount'::public.promotion_type then
      promotion_record.value
    when 'special_price'::public.promotion_type then
      greatest(
        enrollment_record.price_snapshot
          - coalesce(promotion_record.special_price, promotion_record.value),
        0
      )
    when 'free'::public.promotion_type then
      enrollment_record.price_snapshot
    else 0
  end;

  if promotion_record.max_discount is not null then
    calculated_discount := least(calculated_discount, promotion_record.max_discount);
  end if;

  calculated_discount := least(
    greatest(calculated_discount, 0),
    enrollment_record.price_snapshot
  );
  final_amount := greatest(
    enrollment_record.price_snapshot - calculated_discount,
    0
  );

  perform set_config('app.promotion_checkout', 'on', true);

  update public.enrollments
  set promotion_id = promotion_record.id,
      promotion_code_snapshot = promotion_record.code,
      promotion_name_snapshot = promotion_record.name,
      discount_amount = calculated_discount,
      updated_at = now()
  where id = enrollment_record.id;

  return jsonb_build_object(
    'promotion_id', promotion_record.id,
    'promotion_code', promotion_record.code,
    'promotion_name', promotion_record.name,
    'discount_amount', calculated_discount,
    'final_amount', final_amount
  );
end;
$$;

create or replace function public.submit_deferred_zero_payment(
  target_enrollment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile_id uuid := (select auth.uid());
  enrollment_record public.enrollments%rowtype;
  payment_record public.payments%rowtype;
  final_amount numeric := 0;
begin
  if current_profile_id is null or not private.is_active_student() then
    raise exception 'Hanya peserta aktif yang dapat mengirim pembayaran.'
      using errcode = '42501';
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

  if enrollment_record.payment_timing <> 'deferred'::public.payment_timing
     or enrollment_record.status <> 'active'::public.enrollment_status then
    raise exception 'Pembayaran akhir hanya tersedia pada enrollment aktif.'
      using errcode = '22023';
  end if;

  final_amount := greatest(
    enrollment_record.price_snapshot - enrollment_record.discount_amount,
    0
  );

  if final_amount <> 0 then
    raise exception 'Enrollment ini masih memiliki nominal pembayaran.'
      using errcode = '22023';
  end if;

  select *
  into payment_record
  from public.payments
  where enrollment_id = enrollment_record.id
  for update;

  if found then
    if payment_record.status = 'approved'::public.payment_status then
      raise exception 'Pembayaran sudah disetujui.' using errcode = '22023';
    end if;

    update public.payments
    set amount = 0,
        payment_method = 'free'::public.payment_method,
        payment_proof_path = null,
        status = 'pending'::public.payment_status,
        paid_at = now(),
        verified_at = null,
        verified_by = null,
        notes = null,
        updated_at = now()
    where id = payment_record.id;
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
      0,
      'free'::public.payment_method,
      null,
      'pending'::public.payment_status,
      now()
    );
  end if;

  return jsonb_build_object(
    'enrollment_id', enrollment_record.id,
    'status', 'active',
    'amount', 0
  );
end;
$$;

revoke all on function public.get_enrollment_payment_account(uuid) from public, anon;
grant execute on function public.get_enrollment_payment_account(uuid) to authenticated;

revoke all on function public.admin_update_enrollment_payment_timing(uuid, public.payment_timing)
  from public, anon;
grant execute on function public.admin_update_enrollment_payment_timing(uuid, public.payment_timing)
  to authenticated;

revoke all on function public.apply_deferred_promotion_code(uuid, text)
  from public, anon;
grant execute on function public.apply_deferred_promotion_code(uuid, text)
  to authenticated;

revoke all on function public.submit_deferred_zero_payment(uuid)
  from public, anon;
grant execute on function public.submit_deferred_zero_payment(uuid)
  to authenticated;

commit;
