begin;

set local statement_timeout = '30s';

do $$
declare
  test_profile_id constant uuid := 'f1000000-0000-0000-0000-000000000001';
  test_course_id uuid;
  test_price numeric;
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

  select c.id, case when c.is_free then 0::numeric else c.price end
  into test_course_id, test_price
  from public.courses c
  where c.status = 'active'::public.course_status
  order by c.created_at
  limit 1;

  if test_course_id is null then
    raise exception 'Tidak ada course aktif untuk pengujian re-enrollment.';
  end if;

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
