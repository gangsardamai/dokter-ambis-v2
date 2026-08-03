begin;

set local statement_timeout = '30s';

do $$
declare
  test_profile_id uuid;
  test_course_id constant uuid := 'f0000000-0000-0000-0000-000000000001';
  test_price numeric := 100000;
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

  select p.id
  into test_profile_id
  from public.profiles p
  where p.role = 'student'::public.profile_role
    and p.status = 'active'::public.profile_status
  order by p.created_at
  limit 1;

  if test_profile_id is null then
    raise exception 'Tidak ada peserta aktif untuk pengujian re-enrollment.';
  end if;

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
  )
  select
    test_course_id,
    c.organization_id,
    c.program_id,
    'reenrollment-ci-test',
    'Re-enrollment CI Test',
    'Course sementara untuk pengujian; seluruh transaksi akan di-rollback.',
    'active'::public.course_status,
    test_price,
    false,
    c.payment_account_id,
    'upfront_only'::public.payment_policy
  from public.courses c
  where c.status = 'active'::public.course_status
  order by c.created_at
  limit 1;

  if not found then
    raise exception 'Tidak ada course aktif yang dapat menjadi template pengujian.';
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
