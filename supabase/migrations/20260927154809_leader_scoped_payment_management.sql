
-- Extend scoped Leader enrollment management to payment verification and payment timing.
-- Leaders remain limited to enrollments inside their assigned organization/program/course scope.

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

  if private.is_active_leader()
     and private.leader_can_manage_enrollment(old.enrollment_id) then
    return new;
  end if;

  if (select auth.uid()) is null
     or not exists (
       select 1
       from public.enrollments e
       where e.id = old.enrollment_id
         and e.profile_id = (select auth.uid())
     ) then
    raise exception 'Pembayaran hanya dapat diubah oleh pemilik atau staff berwenang.'
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

revoke all on function private.guard_student_payment_update() from public, anon, authenticated;

create or replace function private.guard_leader_enrollment_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.courses;
  current_payment_status public.payment_status;
begin
  if not private.is_active_leader() then
    return new;
  end if;

  if not private.leader_can_manage_course_for(new.course_id, 'manage_enrollment') then
    raise exception 'Enrollment di luar scope Leader.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    select * into c from public.courses where id = new.course_id;

    if c.status <> 'active'
       or not exists (
         select 1 from public.profiles
         where id = new.profile_id
           and role = 'student'
           and status = 'active'
       )
       or new.price_snapshot is distinct from
          (case when c.is_free then 0 else c.price end)
       or new.discount_amount <> 0
       or new.promotion_id is not null
       or new.promotion_code_snapshot is not null
       or new.promotion_name_snapshot is not null
       or new.activated_at is not null
       or new.expired_at is not null
       or new.status is distinct from
          (case
             when new.payment_timing = 'deferred'
               then 'pending_approval'::public.enrollment_status
             else 'pending_payment'::public.enrollment_status
           end) then
      raise exception 'Data awal enrollment tidak valid.' using errcode = '42501';
    end if;

    return new;
  end if;

  if (to_jsonb(new) - array[
        'status',
        'category',
        'payment_timing',
        'activated_at',
        'updated_at'
      ])
     is distinct from
     (to_jsonb(old) - array[
        'status',
        'category',
        'payment_timing',
        'activated_at',
        'updated_at'
      ]) then
    raise exception 'Leader tidak dapat mengubah identitas, harga, masa akses atau data enrollment yang dilindungi.'
      using errcode = '42501';
  end if;

  if new.payment_timing is distinct from old.payment_timing then
    if old.payment_timing <> 'upfront'::public.payment_timing
       or new.payment_timing <> 'deferred'::public.payment_timing then
      raise exception 'Leader hanya dapat mengubah Bayar di Awal menjadi Bayar di Akhir.'
        using errcode = '42501';
    end if;

    select * into c
    from public.courses
    where id = old.course_id;

    if c.payment_policy <> 'upfront_or_deferred'::public.payment_policy then
      raise exception 'Course ini tidak menyediakan pembayaran di akhir.'
        using errcode = '22023';
    end if;

    select p.status
    into current_payment_status
    from public.payments p
    where p.enrollment_id = old.id;

    if old.status = 'active'::public.enrollment_status
       or current_payment_status = 'approved'::public.payment_status then
      new.status := 'active'::public.enrollment_status;
      new.activated_at := coalesce(old.activated_at, now());
    else
      new.status := 'pending_approval'::public.enrollment_status;
      new.activated_at := null;
    end if;

    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'active'::public.enrollment_status
       and old.status in (
         'pending_payment'::public.enrollment_status,
         'pending_approval'::public.enrollment_status
       ) then
      new.activated_at := coalesce(old.activated_at, now());

    elsif new.status = 'pending_payment'::public.enrollment_status
       and old.status = 'pending_approval'::public.enrollment_status
       and old.payment_timing = 'upfront'::public.payment_timing
       and exists (
         select 1
         from public.payments p
         where p.enrollment_id = old.id
           and p.status = 'rejected'::public.payment_status
       ) then
      new.activated_at := null;

    elsif new.status = 'cancelled'::public.enrollment_status
       and old.status in (
         'pending_payment'::public.enrollment_status,
         'pending_approval'::public.enrollment_status,
         'active'::public.enrollment_status
       ) then
      new.activated_at := null;

    else
      raise exception 'Perubahan status enrollment tidak diizinkan untuk Leader.'
        using errcode = '42501';
    end if;

  elsif new.activated_at is distinct from old.activated_at then
    raise exception 'Waktu aktivasi tidak dapat diubah Leader secara langsung.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_leader_enrollment_write() from public, anon, authenticated;

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

  if not private.is_active_admin()
     and not private.leader_can_manage_enrollment(payment_record.enrollment_id) then
    raise exception 'Payment berada di luar scope atau izin Anda.'
      using errcode = '42501';
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
        when target_status = 'rejected'::public.payment_status
          then normalized_notes
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
    format(
      'Payment %s untuk enrollment %s oleh %s.',
      target_status,
      enrollment_record.id,
      case
        when private.is_active_admin() then 'Admin'
        else 'Leader'
      end
    )
  );

  return payment_record;
end;
$$;

revoke all on function public.admin_review_payment(uuid, public.payment_status, text)
from public, anon;
grant execute on function public.admin_review_payment(uuid, public.payment_status, text)
to authenticated;

create or replace function public.admin_approve_all_pending_payments()
returns setof public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved_payment_ids uuid[] := array[]::uuid[];
  approved_count integer := 0;
  caller_is_admin boolean := private.is_active_admin();
begin
  if not caller_is_admin
     and not private.leader_has_permission('manage_enrollment') then
    raise exception 'Akses pengelolaan enrollment diperlukan.'
      using errcode = '42501';
  end if;

  with approved as (
    update public.payments p
    set status = 'approved'::public.payment_status,
        verified_by = (select auth.uid()),
        verified_at = now(),
        notes = null,
        updated_at = now()
    where p.status = 'pending'::public.payment_status
      and (
        caller_is_admin
        or private.leader_can_manage_enrollment(p.enrollment_id)
      )
    returning p.id
  )
  select coalesce(array_agg(id), array[]::uuid[])
  into approved_payment_ids
  from approved;

  approved_count := cardinality(approved_payment_ids);

  update public.enrollments e
  set status = 'active'::public.enrollment_status,
      activated_at = coalesce(e.activated_at, now()),
      updated_at = now()
  from public.payments p
  where p.id = any(approved_payment_ids)
    and e.id = p.enrollment_id
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
      format(
        '%s payment menunggu berhasil disetujui oleh %s.',
        approved_count,
        case when caller_is_admin then 'Admin' else 'Leader' end
      )
    );
  end if;

  return query
  select p.*
  from public.payments p
  where p.id = any(approved_payment_ids)
  order by p.created_at;
end;
$$;

revoke all on function public.admin_approve_all_pending_payments()
from public, anon;
grant execute on function public.admin_approve_all_pending_payments()
to authenticated;

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
  caller_is_admin boolean := private.is_active_admin();
begin
  select *
  into enrollment_record
  from public.enrollments
  where id = target_enrollment_id
  for update;

  if not found then
    raise exception 'Enrollment tidak ditemukan.' using errcode = 'P0002';
  end if;

  if not caller_is_admin
     and not private.leader_can_manage_enrollment(enrollment_record.id) then
    raise exception 'Enrollment berada di luar scope atau izin Anda.'
      using errcode = '42501';
  end if;

  if not caller_is_admin
     and (
       enrollment_record.payment_timing <> 'upfront'::public.payment_timing
       or target_payment_timing <> 'deferred'::public.payment_timing
     ) then
    raise exception 'Leader hanya dapat mengubah Bayar di Awal menjadi Bayar di Akhir.'
      using errcode = '42501';
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
      'Payment timing diubah dari %s menjadi %s; status enrollment %s menjadi %s oleh %s.',
      enrollment_record.payment_timing,
      target_payment_timing,
      enrollment_record.status,
      next_status,
      case when caller_is_admin then 'Admin' else 'Leader' end
    )
  );
end;
$$;

revoke all on function public.admin_update_enrollment_payment_timing(
  uuid,
  public.payment_timing
) from public, anon;
grant execute on function public.admin_update_enrollment_payment_timing(
  uuid,
  public.payment_timing
) to authenticated;

drop policy if exists "Staff read payment proofs" on storage.objects;
drop policy if exists "Admins read payment proofs" on storage.objects;

create policy "Staff read payment proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (select private.is_active_admin())
    or exists (
      select 1
      from public.payments p
      where p.payment_proof_path = storage.objects.name
        and private.leader_can_manage_enrollment(p.enrollment_id)
    )
  )
);
