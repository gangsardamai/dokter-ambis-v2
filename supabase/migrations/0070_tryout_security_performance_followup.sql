begin;

-- Remove default API privileges that are not required by the application.
revoke all privileges on table public.tryouts from anon, authenticated;
revoke all privileges on table public.tryout_questions from anon, authenticated;
revoke all privileges on table public.tryout_options from anon, authenticated;
revoke all privileges on table public.tryout_attempts from anon, authenticated;
revoke all privileges on table public.tryout_answers from anon, authenticated;
revoke all privileges on table public.tryout_results from anon, authenticated;

grant select, insert, update, delete on table public.tryouts to authenticated;
grant select, insert, update, delete on table public.tryout_questions to authenticated;
grant select, insert, update, delete on table public.tryout_options to authenticated;
grant select on table public.tryout_attempts to authenticated;
grant select on table public.tryout_answers to authenticated;
grant select on table public.tryout_results to authenticated;

-- Cover foreign keys used by administration, review, and cleanup queries.
create index if not exists idx_tryout_answers_question_id
  on public.tryout_answers(question_id);
create index if not exists idx_tryout_answers_selected_option_id
  on public.tryout_answers(selected_option_id)
  where selected_option_id is not null;
create index if not exists idx_tryout_results_profile_id
  on public.tryout_results(profile_id);
create index if not exists idx_tryouts_created_by
  on public.tryouts(created_by);

-- Consolidate SELECT policies and evaluate auth helpers once per statement.
drop policy if exists tryouts_admin_all on public.tryouts;
drop policy if exists tryouts_student_select on public.tryouts;

create policy tryouts_select on public.tryouts
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'student'
    and publication_status in ('scheduled', 'published', 'closed')
    and exists (
      select 1
      from public.enrollments e
      where e.profile_id = (select auth.uid())
        and e.course_id = tryouts.course_id
        and e.status = 'active'
        and (e.expired_at is null or e.expired_at > now())
    )
  )
);

create policy tryouts_admin_insert on public.tryouts
for insert to authenticated
with check ((select public.current_profile_role()) = 'admin');

create policy tryouts_admin_update on public.tryouts
for update to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

create policy tryouts_admin_delete on public.tryouts
for delete to authenticated
using ((select public.current_profile_role()) = 'admin');

drop policy if exists tryout_attempts_admin_select on public.tryout_attempts;
drop policy if exists tryout_attempts_student_select on public.tryout_attempts;

create policy tryout_attempts_select on public.tryout_attempts
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    profile_id = (select auth.uid())
    and (
      status = 'in_progress'
      or exists (
        select 1
        from public.tryouts t
        where t.id = tryout_attempts.tryout_id
          and (
            t.result_release_mode = 'immediate'
            or (
              t.result_release_mode = 'after_close'
              and t.close_at is not null
              and now() >= t.close_at
            )
          )
      )
    )
  )
);

drop policy if exists tryout_answers_admin_select on public.tryout_answers;
drop policy if exists tryout_answers_student_select on public.tryout_answers;

create policy tryout_answers_select on public.tryout_answers
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or exists (
    select 1
    from public.tryout_attempts a
    join public.tryouts t on t.id = a.tryout_id
    where a.id = tryout_answers.attempt_id
      and a.profile_id = (select auth.uid())
      and (
        a.status = 'in_progress'
        or t.review_release_mode = 'immediate'
        or (
          t.review_release_mode = 'after_close'
          and t.close_at is not null
          and now() >= t.close_at
        )
      )
  )
);

drop policy if exists tryout_results_admin_select on public.tryout_results;
drop policy if exists tryout_results_student_select on public.tryout_results;

create policy tryout_results_select on public.tryout_results
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    profile_id = (select auth.uid())
    and exists (
      select 1
      from public.tryouts t
      where t.id = tryout_results.tryout_id
        and (
          t.result_release_mode = 'immediate'
          or (
            t.result_release_mode = 'after_close'
            and t.close_at is not null
            and now() >= t.close_at
          )
        )
    )
  )
);

commit;
