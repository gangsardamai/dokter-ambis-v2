
create index if not exists organizations_created_by_idx on public.organizations(created_by);
create index if not exists organizations_updated_by_idx on public.organizations(updated_by);
create index if not exists programs_created_by_idx on public.programs(created_by);
create index if not exists programs_updated_by_idx on public.programs(updated_by);
create index if not exists courses_created_by_idx on public.courses(created_by);
create index if not exists courses_updated_by_idx on public.courses(updated_by);
create index if not exists leader_scopes_created_by_idx on public.leader_scopes(created_by);
create index if not exists leader_permissions_created_by_idx on public.leader_permissions(created_by);

drop policy if exists enrollments_staff_insert on public.enrollments;
drop policy if exists enrollments_student_insert on public.enrollments;
drop policy if exists enrollments_insert_authorized on public.enrollments;

create policy enrollments_insert_authorized
on public.enrollments
for insert to authenticated
with check (
  (select private.is_active_admin())
  or (
    (select private.leader_has_permission('manage_enrollment'))
    and private.leader_can_access_course(course_id)
  )
  or (
    profile_id = (select auth.uid())
    and (select private.is_active_student())
    and category = 'regular'::public.enrollment_category
    and discount_amount = 0::numeric
    and promotion_id is null
    and promotion_code_snapshot is null
    and promotion_name_snapshot is null
    and activated_at is null
    and expired_at is null
    and exists (
      select 1
      from public.courses c
      where c.id = enrollments.course_id
        and c.status = 'active'::public.course_status
        and enrollments.price_snapshot = case
          when c.is_free then 0::numeric
          else c.price
        end
        and (
          (
            enrollments.payment_timing = 'upfront'::public.payment_timing
            and enrollments.status = 'pending_payment'::public.enrollment_status
          )
          or (
            enrollments.payment_timing = 'deferred'::public.payment_timing
            and enrollments.status = 'pending_approval'::public.enrollment_status
            and c.payment_policy = 'upfront_or_deferred'::public.payment_policy
          )
        )
    )
  )
);
