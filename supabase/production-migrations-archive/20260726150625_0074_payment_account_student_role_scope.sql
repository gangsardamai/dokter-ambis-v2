-- Archived from production migration history.
-- Production version: 20260726150625
-- Production name: 0074_payment_account_student_role_scope
-- Intentionally stored outside supabase/migrations so migration tooling does not replay it.

-- 0074 companion: explicitly restrict participant account access to active students

drop policy if exists payment_accounts_select_authorized on public.payment_accounts;
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
        and e.status in (
          'pending_payment'::public.enrollment_status,
          'pending_approval'::public.enrollment_status
        )
        and c.payment_account_id = payment_accounts.id
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
           and e.status in (
             'pending_payment'::public.enrollment_status,
             'pending_approval'::public.enrollment_status
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

revoke all on function public.get_enrollment_payment_account(uuid) from public, anon;
grant execute on function public.get_enrollment_payment_account(uuid) to authenticated;
