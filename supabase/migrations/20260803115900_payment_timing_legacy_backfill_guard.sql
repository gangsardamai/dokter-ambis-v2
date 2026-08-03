begin;

-- Production may already contain enrollment rows protected by the legacy
-- student-update trigger. Permit only the one-time NULL -> upfront backfill
-- performed by the next migration, while preserving all existing protections.
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

  if (
    (to_jsonb(old) ->> 'payment_timing') is null
    and (to_jsonb(new) ->> 'payment_timing') = 'upfront'
    and (
      to_jsonb(new) - 'payment_timing' - 'updated_at'
    ) is not distinct from (
      to_jsonb(old) - 'payment_timing' - 'updated_at'
    )
  ) then
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

revoke all on function private.guard_student_enrollment_update() from public;

commit;
