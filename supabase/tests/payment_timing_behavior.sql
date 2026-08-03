begin;

-- Fixed UUIDs keep assertions readable. The transaction is rolled back.
insert into auth.users (
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '10000000-0000-0000-0000-000000000001',
    'payment-test-student@example.com',
    '{"full_name":"Payment Test Student","phone":"081111111111"}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'payment-test-admin@example.com',
    '{"full_name":"Payment Test Admin","phone":"082222222222"}'::jsonb,
    now(),
    now()
  );

update public.profiles
set role = 'admin'::public.profile_role
where id = '10000000-0000-0000-0000-000000000002';

insert into public.organizations (
  id, slug, title, short_name, status
) values (
  '20000000-0000-0000-0000-000000000001',
  'payment-test-university',
  'Payment Test University',
  'PTU',
  'active'::public.organization_status
);

insert into public.programs (
  id, organization_id, slug, title, status
) values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'payment-test-program',
  'Payment Test Program',
  'active'::public.program_status
);

insert into public.payment_accounts (
  id,
  label,
  bank_name,
  account_number,
  account_holder_name,
  is_active,
  is_default
) values (
  '40000000-0000-0000-0000-000000000001',
  'Payment Test Account',
  'Bank Test',
  '1234567890',
  'Dokter Ambis Test',
  true,
  false
);

insert into public.courses (
  id,
  organization_id,
  program_id,
  payment_account_id,
  payment_policy,
  slug,
  title,
  status,
  price,
  is_free
) values
  (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'upfront_only'::public.payment_policy,
    'payment-test-upfront',
    'Payment Test Upfront',
    'active'::public.course_status,
    100000,
    false
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'upfront_or_deferred'::public.payment_policy,
    'payment-test-deferred',
    'Payment Test Deferred',
    'active'::public.course_status,
    125000,
    false
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'upfront_or_deferred'::public.payment_policy,
    'payment-test-change-timing',
    'Payment Test Change Timing',
    'active'::public.course_status,
    150000,
    false
  );

insert into public.enrollments (
  id,
  profile_id,
  course_id,
  category,
  payment_timing,
  status,
  price_snapshot,
  discount_amount
) values
  (
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'regular'::public.enrollment_category,
    'upfront'::public.payment_timing,
    'pending_payment'::public.enrollment_status,
    100000,
    0
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    'regular'::public.enrollment_category,
    'deferred'::public.payment_timing,
    'pending_approval'::public.enrollment_status,
    125000,
    0
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'regular'::public.enrollment_category,
    'deferred'::public.payment_timing,
    'active'::public.enrollment_status,
    150000,
    0
  );

-- Upfront: student submission creates payment and atomically moves enrollment
-- to pending approval.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select public.student_submit_payment(
  '60000000-0000-0000-0000-000000000001',
  100000,
  'payment-test/upfront-proof.jpg'
);

do $upfront_submitted$
begin
  if not exists (
    select 1
    from public.enrollments e
    join public.payments p on p.enrollment_id = e.id
    where e.id = '60000000-0000-0000-0000-000000000001'
      and e.status = 'pending_approval'::public.enrollment_status
      and e.activated_at is null
      and p.status = 'pending'::public.payment_status
      and p.amount = 100000
      and p.payment_account_id = '40000000-0000-0000-0000-000000000001'
      and p.bank_name_snapshot = 'Bank Test'
      and p.account_number_snapshot = '1234567890'
      and p.account_holder_name_snapshot = 'Dokter Ambis Test'
      and p.payment_account_label_snapshot = 'Payment Test Account'
  ) then
    raise exception 'Submit upfront tidak memperbarui payment/enrollment secara benar.';
  end if;

  begin
    perform public.student_submit_payment(
      '60000000-0000-0000-0000-000000000001',
      100000,
      'payment-test/upfront-proof-duplicate.jpg'
    );
    raise exception 'Submit ulang payment pending seharusnya ditolak.';
  exception
    when sqlstate '22023' then null;
  end;
end
$upfront_submitted$;

-- Admin approval atomically activates the upfront enrollment.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000002',
  true
);

select public.admin_review_payment(
  (
    select id
    from public.payments
    where enrollment_id = '60000000-0000-0000-0000-000000000001'
  ),
  'approved'::public.payment_status,
  null
);

do $upfront_approved$
begin
  if not exists (
    select 1
    from public.enrollments e
    join public.payments p on p.enrollment_id = e.id
    where e.id = '60000000-0000-0000-0000-000000000001'
      and e.status = 'active'::public.enrollment_status
      and e.activated_at is not null
      and p.status = 'approved'::public.payment_status
      and p.verified_by = '10000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'Approve upfront tidak mengaktifkan enrollment secara atomik.';
  end if;
end
$upfront_approved$;

-- Deferred payment must be blocked until Admin activates the enrollment.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

do $deferred_before_approval$
begin
  begin
    perform public.student_submit_payment(
      '60000000-0000-0000-0000-000000000002',
      125000,
      'payment-test/deferred-too-early.jpg'
    );
    raise exception 'Deferred payment sebelum approval seharusnya ditolak.';
  exception
    when sqlstate '22023' then null;
  end;
end
$deferred_before_approval$;

-- Simulate the Admin approval button for deferred enrollment.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000002',
  true
);

update public.enrollments
set status = 'active'::public.enrollment_status,
    activated_at = now()
where id = '60000000-0000-0000-0000-000000000002';

-- Deferred payment submission and rejection never remove course access.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select public.student_submit_payment(
  '60000000-0000-0000-0000-000000000002',
  125000,
  'payment-test/deferred-proof.jpg'
);

do $deferred_submitted$
begin
  if not exists (
    select 1
    from public.enrollments e
    join public.payments p on p.enrollment_id = e.id
    where e.id = '60000000-0000-0000-0000-000000000002'
      and e.status = 'active'::public.enrollment_status
      and p.status = 'pending'::public.payment_status
  ) then
    raise exception 'Submit deferred mengubah akses course atau payment tidak pending.';
  end if;
end
$deferred_submitted$;

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000002',
  true
);

select public.admin_review_payment(
  (
    select id
    from public.payments
    where enrollment_id = '60000000-0000-0000-0000-000000000002'
  ),
  'rejected'::public.payment_status,
  'Bukti belum jelas'
);

do $deferred_rejected$
begin
  if not exists (
    select 1
    from public.enrollments e
    join public.payments p on p.enrollment_id = e.id
    where e.id = '60000000-0000-0000-0000-000000000002'
      and e.status = 'active'::public.enrollment_status
      and p.status = 'rejected'::public.payment_status
      and p.notes = 'Bukti belum jelas'
  ) then
    raise exception 'Reject deferred seharusnya mempertahankan enrollment aktif.';
  end if;
end
$deferred_rejected$;

-- Student can resubmit only after rejection; Admin approval still preserves
-- active deferred access.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select public.student_submit_payment(
  '60000000-0000-0000-0000-000000000002',
  125000,
  'payment-test/deferred-proof-retry.jpg'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000002',
  true
);

select public.admin_review_payment(
  (
    select id
    from public.payments
    where enrollment_id = '60000000-0000-0000-0000-000000000002'
  ),
  'approved'::public.payment_status,
  null
);

do $deferred_approved$
begin
  if not exists (
    select 1
    from public.enrollments e
    join public.payments p on p.enrollment_id = e.id
    where e.id = '60000000-0000-0000-0000-000000000002'
      and e.status = 'active'::public.enrollment_status
      and p.status = 'approved'::public.payment_status
  ) then
    raise exception 'Approve deferred tidak mempertahankan enrollment aktif.';
  end if;
end
$deferred_approved$;

-- Admin timing changes reconcile access with payment state.
select public.admin_update_enrollment_payment_timing(
  '60000000-0000-0000-0000-000000000003',
  'upfront'::public.payment_timing
);

do $timing_to_upfront$
begin
  if not exists (
    select 1
    from public.enrollments
    where id = '60000000-0000-0000-0000-000000000003'
      and payment_timing = 'upfront'::public.payment_timing
      and status = 'pending_payment'::public.enrollment_status
      and activated_at is null
  ) then
    raise exception 'Deferred aktif tanpa payment harus menjadi pending_payment saat diubah ke upfront.';
  end if;
end
$timing_to_upfront$;

select public.admin_update_enrollment_payment_timing(
  '60000000-0000-0000-0000-000000000003',
  'deferred'::public.payment_timing
);

do $timing_to_deferred$
begin
  if not exists (
    select 1
    from public.enrollments
    where id = '60000000-0000-0000-0000-000000000003'
      and payment_timing = 'deferred'::public.payment_timing
      and status = 'pending_approval'::public.enrollment_status
      and activated_at is null
  ) then
    raise exception 'Upfront unpaid harus menjadi pending_approval saat diubah ke deferred.';
  end if;
end
$timing_to_deferred$;

-- Wrong amount is rejected by the database, not trusted from the browser.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

do $wrong_amount$
begin
  begin
    perform public.student_submit_payment(
      '60000000-0000-0000-0000-000000000003',
      1,
      'payment-test/wrong-amount.jpg'
    );
    raise exception 'Nominal payment yang salah seharusnya ditolak.';
  exception
    when sqlstate '22023' then null;
  end;
end
$wrong_amount$;

do $payment_behavior_complete$
begin
  raise notice 'Payment timing behavioral verification passed.';
end
$payment_behavior_complete$;

rollback;
