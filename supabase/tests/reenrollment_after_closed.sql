begin;

set local statement_timeout = '30s';

do $$
declare
  test_profile_id constant uuid := 'f1000000-0000-0000-0000-000000000001';
  test_organization_id constant uuid := 'f2000000-0000-0000-0000-000000000001';
  test_program_id constant uuid := 'f3000000-0000-0000-0000-000000000001';
  test_payment_account_id constant uuid := 'f4000000-0000-0000-0000-000000000001';
  test_course_id constant uuid := 'f5000000-0000-0000-0000-000000000001';
  test_price constant numeric := 100000;
  duplicate_blocked boolean := false;
  index_definition text;
begin
  select pg_get_indexdef('public.uq_student_course'::regclass)
  into index_definition;

  if index_definition is null
     or index_definition not ilike '% where %'
     or index_definition not ilike '%cancelled%'
     or index_definition not ilike '%expired%' then
    raise exception 'uq_student_course harus berupa partial unique index untuk enrollment yang belum berakhir: %', index_definition;
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    test_profile_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'reenrollment-ci@example.invalid',
    extensions.crypt('temporary-ci-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Re-enrollment CI Student","phone":"TEMP-CI"}'::jsonb,
    now(),
    now()
  );

  if not exists (
    select 1
    from public.profiles p
    where p.id = test_profile_id
      and p.role = 'student'::public.profile_role
      and p.status = 'active'::public.profile_status
  ) then
    raise exception 'Profile peserta pengujian tidak terbentuk.';
  end if;

  insert into public.organizations (
    id,
    slug,
    title,
    short_name,
    status,
    is_general
  ) values (
    test_organization_id,
    'reenrollment-ci-org',
    'Re-enrollment CI Organization',
    'RCI',
    'active'::public.organization_status,
    false
  );

  insert into public.programs (
    id,
    organization_id,
    slug,
    title,
    description,
    status
  ) values (
    test_program_id,
    test_organization_id,
    'reenrollment-ci-program',
    'Re-enrollment CI Program',
    'Program sementara untuk pengujian; transaksi akan di-rollback.',
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
    test_payment_account_id,
    'Re-enrollment CI Account',
    'Bank CI',
    '1234567890',
    'Dokter Ambis CI',
    true,
    false
  );

  insert into public.courses (
    id,
    organization_id,
    program_id,
    slug,
    title,
    description,
    status,
    price,
    is_free,
    payment_account_id,
    payment_policy
  ) values (
    test_course_id,
    test_organization_id,
    test_program_id,
    'reenrollment-ci-course',
    'Re-enrollment CI Course',
    'Course sementara untuk pengujian; transaksi akan di-rollback.',
    'active'::public.course_status,
    test_price,
    false,
    test_payment_account_id,
    'upfront_only'::public.payment_policy
  );

  insert into public.enrollments (
    profile_id,
    course_id,
    category,
    status,
    price_snapshot,
    discount_amount,
    payment_timing
  ) values (
    test_profile_id,
    test_course_id,
    'regular'::public.enrollment_category,
    'cancelled'::public.enrollment_status,
    test_price,
    0,
    'upfront'::public.payment_timing
  );

  insert into public.enrollments (
    profile_id,
    course_id,
    category,
    status,
    price_snapshot,
    discount_amount,
    payment_timing
  ) values (
    test_profile_id,
    test_course_id,
    'regular'::public.enrollment_category,
    'pending_payment'::public.enrollment_status,
    test_price,
    0,
    'upfront'::public.payment_timing
  );

  begin
    insert into public.enrollments (
      profile_id,
      course_id,
      category,
      status,
      price_snapshot,
      discount_amount,
      payment_timing
    ) values (
      test_profile_id,
      test_course_id,
      'regular'::public.enrollment_category,
      'pending_approval'::public.enrollment_status,
      test_price,
      0,
      'upfront'::public.payment_timing
    );
  exception
    when unique_violation then
      duplicate_blocked := true;
  end;

  if not duplicate_blocked then
    raise exception 'Enrollment aktif/proses ganda untuk peserta dan course yang sama tidak terblokir.';
  end if;

  raise notice 'Re-enrollment after a closed enrollment verification passed.';
end
$$;

rollback;
