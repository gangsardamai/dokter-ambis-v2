begin;

set local statement_timeout = '30s';

do $$
declare
  test_profile_id uuid;
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

  select p.id, c.id, case when c.is_free then 0::numeric else c.price end
  into test_profile_id, test_course_id, test_price
  from public.profiles p
  cross join public.courses c
  where p.role = 'student'::public.profile_role
    and p.status = 'active'::public.profile_status
    and c.status = 'active'::public.course_status
    and not exists (
      select 1
      from public.enrollments e
      where e.profile_id = p.id
        and e.course_id = c.id
    )
  order by p.created_at, c.created_at
  limit 1;

  if test_profile_id is null or test_course_id is null then
    raise exception 'Tidak ada pasangan peserta-course kosong untuk pengujian re-enrollment.';
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
end
$$;

rollback;
