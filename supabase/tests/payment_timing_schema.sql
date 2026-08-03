begin;

do $payment_timing_test$
declare
  actual_labels text[];
  actual_default text;
  actual_nullable text;
  function_name text;
begin
  select array_agg(e.enumlabel order by e.enumsortorder)
  into actual_labels
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
    and t.typname = 'payment_policy';

  if actual_labels is distinct from array['upfront_only', 'upfront_or_deferred'] then
    raise exception 'payment_policy enum tidak sesuai: %', actual_labels;
  end if;

  select array_agg(e.enumlabel order by e.enumsortorder)
  into actual_labels
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
    and t.typname = 'payment_timing';

  if actual_labels is distinct from array['upfront', 'deferred'] then
    raise exception 'payment_timing enum tidak sesuai: %', actual_labels;
  end if;

  select column_default, is_nullable
  into actual_default, actual_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'courses'
    and column_name = 'payment_policy';

  if actual_default is null or actual_default not like '%upfront_only%' then
    raise exception 'Default courses.payment_policy tidak sesuai: %', actual_default;
  end if;

  if actual_nullable <> 'NO' then
    raise exception 'courses.payment_policy harus NOT NULL.';
  end if;

  select column_default, is_nullable
  into actual_default, actual_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'enrollments'
    and column_name = 'payment_timing';

  if actual_default is null or actual_default not like '%upfront%' then
    raise exception 'Default enrollments.payment_timing tidak sesuai: %', actual_default;
  end if;

  if actual_nullable <> 'NO' then
    raise exception 'enrollments.payment_timing harus NOT NULL.';
  end if;

  if to_regclass('public.idx_courses_payment_policy') is null then
    raise exception 'Index idx_courses_payment_policy tidak ditemukan.';
  end if;

  if to_regclass('public.idx_enrollments_payment_timing_created') is null then
    raise exception 'Index idx_enrollments_payment_timing_created tidak ditemukan.';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_validate_enrollment_payment_timing'
      and not tgisinternal
  ) then
    raise exception 'Trigger validasi payment timing tidak ditemukan.';
  end if;

  foreach function_name in array array[
    'public.get_enrollment_payment_account(uuid)',
    'public.admin_update_enrollment_payment_timing(uuid,public.payment_timing)',
    'public.apply_deferred_promotion_code(uuid,text)',
    'public.submit_deferred_zero_payment(uuid)'
  ]
  loop
    if to_regprocedure(function_name) is null then
      raise exception 'RPC tidak ditemukan: %', function_name;
    end if;

    if not exists (
      select 1
      from pg_proc
      where oid = to_regprocedure(function_name)
        and prosecdef
    ) then
      raise exception 'RPC harus SECURITY DEFINER: %', function_name;
    end if;
  end loop;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'enrollments'
      and policyname = 'enrollments_student_insert'
  ) then
    raise exception 'Policy enrollments_student_insert tidak ditemukan.';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_accounts'
      and policyname = 'payment_accounts_select_authorized'
  ) then
    raise exception 'Policy payment_accounts_select_authorized tidak ditemukan.';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'payments_student_insert'
  ) then
    raise exception 'Policy payments_student_insert tidak ditemukan.';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'payments_update_authorized'
  ) then
    raise exception 'Policy payments_update_authorized tidak ditemukan.';
  end if;

  raise notice 'Payment timing schema verification passed.';
end
$payment_timing_test$;

rollback;
