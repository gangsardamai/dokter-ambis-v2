begin;

create or replace function public.admin_approve_all_pending_payments()
returns setof public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved_payment_ids uuid[] := array[]::uuid[];
  approved_count integer := 0;
begin
  if not private.is_active_admin() then
    raise exception 'Akses Admin diperlukan.' using errcode = '42501';
  end if;

  with approved as (
    update public.payments
    set status = 'approved'::public.payment_status,
        verified_by = (select auth.uid()),
        verified_at = now(),
        notes = null,
        updated_at = now()
    where status = 'pending'::public.payment_status
    returning id
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
      format('%s payment menunggu berhasil disetujui.', approved_count)
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

commit;
