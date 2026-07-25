begin;

drop policy if exists lesson_message_threads_student_insert
on public.lesson_message_threads;

create policy lesson_message_threads_student_insert
on public.lesson_message_threads
for insert
to authenticated
with check (
  lesson_message_threads.student_profile_id = auth.uid()
  and public.current_profile_role() = 'student'
  and exists (
    select 1
    from public.lessons l
    where l.id = lesson_message_threads.lesson_id
      and l.course_id = lesson_message_threads.course_id
  )
  and exists (
    select 1
    from public.enrollments e
    where e.profile_id = auth.uid()
      and e.course_id = lesson_message_threads.course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  )
);

commit;
