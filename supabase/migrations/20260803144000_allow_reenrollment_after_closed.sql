begin;

-- A participant may register for the same course again after the previous
-- enrollment has ended. Keep at most one active/in-progress enrollment for
-- each participant-course pair.
alter table public.enrollments
  drop constraint if exists uq_student_course;

alter table public.enrollments
  drop constraint if exists uq_enrollments_profile_course;

drop index if exists public.uq_student_course;
drop index if exists public.uq_enrollments_profile_course;

create unique index uq_student_course
  on public.enrollments(profile_id, course_id)
  where status not in (
    'cancelled'::public.enrollment_status,
    'expired'::public.enrollment_status
  );

commit;
