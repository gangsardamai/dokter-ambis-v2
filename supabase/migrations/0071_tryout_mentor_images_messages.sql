begin;

create or replace function public.is_assigned_mentor(
  target_profile_id uuid,
  target_course_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mentor_details md
    join public.course_mentors cm on cm.mentor_id = md.id
    where md.profile_id = target_profile_id
      and cm.course_id = target_course_id
  );
$$;

create or replace function public.can_manage_tryout(target_tryout_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tryouts t
    where t.id = target_tryout_id
      and (
        (select public.current_profile_role()) = 'admin'
        or (
          (select public.current_profile_role()) = 'mentor'
          and t.created_by = (select auth.uid())
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  );
$$;

revoke all on function public.is_assigned_mentor(uuid, uuid) from public;
revoke all on function public.can_manage_tryout(uuid) from public;
grant execute on function public.is_assigned_mentor(uuid, uuid) to authenticated;
grant execute on function public.can_manage_tryout(uuid) to authenticated;

-- Try Out: Admin sees all; mentor only owns Try Outs in assigned courses; students unchanged.
drop policy if exists tryouts_select on public.tryouts;
drop policy if exists tryouts_admin_insert on public.tryouts;
drop policy if exists tryouts_admin_update on public.tryouts;
drop policy if exists tryouts_admin_delete on public.tryouts;

create policy tryouts_select on public.tryouts
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'mentor'
    and created_by = (select auth.uid())
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
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

create policy tryouts_manager_insert on public.tryouts
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (select public.current_profile_role()) = 'admin'
    or (
      (select public.current_profile_role()) = 'mentor'
      and public.is_assigned_mentor((select auth.uid()), course_id)
    )
  )
);

create policy tryouts_manager_update on public.tryouts
for update to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'mentor'
    and created_by = (select auth.uid())
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
)
with check (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'mentor'
    and created_by = (select auth.uid())
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
);

create policy tryouts_manager_delete on public.tryouts
for delete to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'mentor'
    and created_by = (select auth.uid())
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
);

-- Question and option writes are only allowed through validated RPCs.
drop policy if exists tryout_questions_admin_all on public.tryout_questions;
drop policy if exists tryout_options_admin_all on public.tryout_options;

create policy tryout_questions_manager_select on public.tryout_questions
for select to authenticated
using (public.can_manage_tryout(tryout_id));

create policy tryout_options_manager_select on public.tryout_options
for select to authenticated
using (
  exists (
    select 1
    from public.tryout_questions q
    where q.id = tryout_options.question_id
      and public.can_manage_tryout(q.tryout_id)
  )
);

revoke insert, update, delete on table public.tryout_questions from authenticated;
revoke insert, update, delete on table public.tryout_options from authenticated;
grant select on table public.tryout_questions to authenticated;
grant select on table public.tryout_options to authenticated;

-- Mentors can read attempts, answers and results only for their own Try Outs.
drop policy if exists tryout_attempts_select on public.tryout_attempts;
create policy tryout_attempts_select on public.tryout_attempts
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'mentor'
    and public.can_manage_tryout(tryout_id)
  )
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

drop policy if exists tryout_answers_select on public.tryout_answers;
create policy tryout_answers_select on public.tryout_answers
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or exists (
    select 1
    from public.tryout_attempts manager_attempt
    where manager_attempt.id = tryout_answers.attempt_id
      and (select public.current_profile_role()) = 'mentor'
      and public.can_manage_tryout(manager_attempt.tryout_id)
  )
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

drop policy if exists tryout_results_select on public.tryout_results;
create policy tryout_results_select on public.tryout_results
for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'mentor'
    and public.can_manage_tryout(tryout_id)
  )
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

-- Exactly four choices (A-D), optional question/explanation images, Admin or owning mentor.
drop function if exists public.admin_create_tryout_question(uuid, text, text, text, text, integer, text[], integer);
create function public.admin_create_tryout_question(
  target_tryout_id uuid,
  question_text text,
  explanation_text text,
  question_image_path text,
  explanation_image_path text,
  topic_text text,
  difficulty_text text,
  question_points integer,
  option_texts text[],
  correct_option_index integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_question_id uuid;
  next_order integer;
  option_index integer;
begin
  if not public.can_manage_tryout(target_tryout_id) then
    raise exception 'Anda tidak dapat mengelola Try Out ini.';
  end if;

  if char_length(btrim(question_text)) = 0 then
    raise exception 'Pertanyaan wajib diisi.';
  end if;

  if array_length(option_texts, 1) is distinct from 4
     or exists (select 1 from unnest(option_texts) as option_value(value) where char_length(btrim(value)) = 0) then
    raise exception 'Pilihan jawaban wajib terdiri dari A, B, C, dan D.';
  end if;

  if correct_option_index not between 1 and 4 then
    raise exception 'Jawaban benar harus A, B, C, atau D.';
  end if;

  select coalesce(max(q.question_order), 0) + 1
  into next_order
  from public.tryout_questions q
  where q.tryout_id = target_tryout_id;

  insert into public.tryout_questions (
    tryout_id, question_order, question, explanation, image_path,
    explanation_image_path, topic, difficulty, points
  ) values (
    target_tryout_id,
    next_order,
    btrim(question_text),
    nullif(btrim(explanation_text), ''),
    nullif(btrim(question_image_path), ''),
    nullif(btrim(explanation_image_path), ''),
    coalesce(nullif(btrim(topic_text), ''), 'Umum'),
    difficulty_text,
    question_points
  ) returning id into new_question_id;

  for option_index in 1..4 loop
    insert into public.tryout_options (
      question_id, option_order, option_text, is_correct
    ) values (
      new_question_id,
      option_index,
      btrim(option_texts[option_index]),
      option_index = correct_option_index
    );
  end loop;

  return new_question_id;
end;
$$;

drop function if exists public.admin_update_tryout_question(uuid, text, text, text, text, integer, text[], integer);
create function public.admin_update_tryout_question(
  target_question_id uuid,
  question_text text,
  explanation_text text,
  question_image_path text,
  explanation_image_path text,
  topic_text text,
  difficulty_text text,
  question_points integer,
  option_texts text[],
  correct_option_index integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tryout_id uuid;
  option_index integer;
begin
  select q.tryout_id into target_tryout_id
  from public.tryout_questions q
  where q.id = target_question_id;

  if target_tryout_id is null or not public.can_manage_tryout(target_tryout_id) then
    raise exception 'Soal Try Out tidak ditemukan atau tidak dapat Anda kelola.';
  end if;

  if char_length(btrim(question_text)) = 0 then
    raise exception 'Pertanyaan wajib diisi.';
  end if;

  if array_length(option_texts, 1) is distinct from 4
     or exists (select 1 from unnest(option_texts) as option_value(value) where char_length(btrim(value)) = 0) then
    raise exception 'Pilihan jawaban wajib terdiri dari A, B, C, dan D.';
  end if;

  if correct_option_index not between 1 and 4 then
    raise exception 'Jawaban benar harus A, B, C, atau D.';
  end if;

  update public.tryout_questions
  set
    question = btrim(question_text),
    explanation = nullif(btrim(explanation_text), ''),
    image_path = nullif(btrim(question_image_path), ''),
    explanation_image_path = nullif(btrim(explanation_image_path), ''),
    topic = coalesce(nullif(btrim(topic_text), ''), 'Umum'),
    difficulty = difficulty_text,
    points = question_points
  where id = target_question_id;

  delete from public.tryout_options where question_id = target_question_id;

  for option_index in 1..4 loop
    insert into public.tryout_options (
      question_id, option_order, option_text, is_correct
    ) values (
      target_question_id,
      option_index,
      btrim(option_texts[option_index]),
      option_index = correct_option_index
    );
  end loop;

  return target_question_id;
end;
$$;

create or replace function public.manage_delete_tryout_question(target_question_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tryout_id uuid;
begin
  select q.tryout_id into target_tryout_id
  from public.tryout_questions q
  where q.id = target_question_id;

  if target_tryout_id is null or not public.can_manage_tryout(target_tryout_id) then
    raise exception 'Soal Try Out tidak ditemukan atau tidak dapat Anda kelola.';
  end if;

  delete from public.tryout_questions where id = target_question_id;
  return target_question_id;
end;
$$;

revoke all on function public.admin_create_tryout_question(uuid, text, text, text, text, text, text, integer, text[], integer) from public;
revoke all on function public.admin_update_tryout_question(uuid, text, text, text, text, text, text, integer, text[], integer) from public;
revoke all on function public.manage_delete_tryout_question(uuid) from public;
grant execute on function public.admin_create_tryout_question(uuid, text, text, text, text, text, text, integer, text[], integer) to authenticated;
grant execute on function public.admin_update_tryout_question(uuid, text, text, text, text, text, text, integer, text[], integer) to authenticated;
grant execute on function public.manage_delete_tryout_question(uuid) to authenticated;


-- Limited profile/result RPCs avoid granting mentors broad access to profile rows.
create or replace function public.get_message_participant_summaries(
  target_profile_ids uuid[]
)
returns table (
  id uuid,
  full_name text,
  university_origin text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if (select public.current_profile_role()) = 'admin' then
    return query
    select p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(target_profile_ids);
    return;
  end if;

  if (select public.current_profile_role()) <> 'mentor' then
    raise exception 'Akses pengelola diperlukan.';
  end if;

  return query
  select p.id, p.full_name::text, p.university_origin::text
  from public.profiles p
  where p.id = any(target_profile_ids)
    and exists (
      select 1
      from public.lesson_message_threads t
      where t.student_profile_id = p.id
        and public.is_assigned_mentor((select auth.uid()), t.course_id)
    );
end;
$$;

create or replace function public.get_managed_tryout_results(
  target_tryout_id uuid
)
returns table (
  attempt_id uuid,
  student_name text,
  university_origin text,
  attempt_number integer,
  status text,
  score numeric,
  total_correct integer,
  total_wrong integer,
  total_unanswered integer,
  duration_seconds integer,
  submitted_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_manage_tryout(target_tryout_id) then
    raise exception 'Try Out tidak ditemukan atau tidak dapat Anda kelola.';
  end if;

  return query
  select
    a.id,
    p.full_name::text,
    p.university_origin::text,
    a.attempt_number,
    a.status,
    a.score,
    a.total_correct,
    a.total_wrong,
    a.total_unanswered,
    a.duration_seconds,
    a.submitted_at
  from public.tryout_attempts a
  join public.profiles p on p.id = a.profile_id
  where a.tryout_id = target_tryout_id
    and a.status <> 'in_progress'
  order by a.score desc nulls last, a.submitted_at asc;
end;
$$;

revoke all on function public.get_message_participant_summaries(uuid[]) from public;
revoke all on function public.get_managed_tryout_results(uuid) from public;
grant execute on function public.get_message_participant_summaries(uuid[]) to authenticated;
grant execute on function public.get_managed_tryout_results(uuid) to authenticated;

-- Mentor inbox: only assigned courses, reply only; Admin retains close/reopen.
-- Rebuild existing message policies with auth helpers evaluated once per statement.
drop policy if exists lesson_message_threads_student_insert on public.lesson_message_threads;
create policy lesson_message_threads_student_insert
on public.lesson_message_threads
for insert to authenticated
with check (
  student_profile_id = (select auth.uid())
  and (select public.current_profile_role()) = 'student'
  and exists (
    select 1
    from public.lessons l
    where l.id = lesson_message_threads.lesson_id
      and l.course_id = lesson_message_threads.course_id
  )
  and exists (
    select 1
    from public.enrollments e
    where e.profile_id = (select auth.uid())
      and e.course_id = lesson_message_threads.course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  )
);

drop policy if exists lesson_message_threads_admin_update on public.lesson_message_threads;
create policy lesson_message_threads_admin_update
on public.lesson_message_threads
for update to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

alter table public.lesson_message_entries
  drop constraint if exists chk_lesson_message_sender_role;
alter table public.lesson_message_entries
  add constraint chk_lesson_message_sender_role
  check (sender_role in ('student', 'mentor', 'admin'));

create or replace function public.sync_lesson_message_thread_after_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lesson_message_threads
  set
    status = case
      when new.sender_role in ('admin', 'mentor') then 'answered'
      else 'open'
    end,
    last_message_at = new.created_at,
    updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop policy if exists lesson_message_threads_select on public.lesson_message_threads;
create policy lesson_message_threads_select
on public.lesson_message_threads
for select to authenticated
using (
  student_profile_id = (select auth.uid())
  or (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'mentor'
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
);

drop policy if exists lesson_message_entries_select on public.lesson_message_entries;
create policy lesson_message_entries_select
on public.lesson_message_entries
for select to authenticated
using (
  exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_entries.thread_id
      and (
        t.student_profile_id = (select auth.uid())
        or (select public.current_profile_role()) = 'admin'
        or (
          (select public.current_profile_role()) = 'mentor'
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

drop policy if exists lesson_message_entries_insert on public.lesson_message_entries;
create policy lesson_message_entries_insert
on public.lesson_message_entries
for insert to authenticated
with check (
  sender_profile_id = (select auth.uid())
  and sender_role = (select public.current_profile_role())
  and sender_role in ('student', 'mentor', 'admin')
  and exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_entries.thread_id
      and (
        (sender_role = 'student' and t.student_profile_id = (select auth.uid()))
        or sender_role = 'admin'
        or (
          sender_role = 'mentor'
          and t.status <> 'closed'
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

create index if not exists idx_lesson_message_entries_sender_profile
  on public.lesson_message_entries(sender_profile_id);

commit;
