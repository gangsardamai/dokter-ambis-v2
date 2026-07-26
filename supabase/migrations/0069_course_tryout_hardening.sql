begin;

alter table public.tryouts
  add constraint chk_tryouts_result_release_close
  check (result_release_mode <> 'after_close' or close_at is not null),
  add constraint chk_tryouts_review_release_close
  check (review_release_mode <> 'after_close' or close_at is not null);

create or replace function public.guard_tryout_question_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tryout_id uuid;
begin
  target_tryout_id := case
    when tg_op = 'DELETE' then old.tryout_id
    else new.tryout_id
  end;

  if exists (
    select 1
    from public.tryout_attempts a
    where a.tryout_id = target_tryout_id
  ) then
    raise exception 'Soal Try Out tidak dapat diubah setelah attempt peserta dimulai.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.guard_tryout_option_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_question_id uuid;
  target_tryout_id uuid;
begin
  target_question_id := case
    when tg_op = 'DELETE' then old.question_id
    else new.question_id
  end;

  select q.tryout_id
  into target_tryout_id
  from public.tryout_questions q
  where q.id = target_question_id;

  if target_tryout_id is not null and exists (
    select 1
    from public.tryout_attempts a
    where a.tryout_id = target_tryout_id
  ) then
    raise exception 'Pilihan Try Out tidak dapat diubah setelah attempt peserta dimulai.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.guard_tryout_settings_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  highest_attempt integer;
begin
  if tg_op = 'DELETE' then
    if exists (
      select 1 from public.tryout_attempts a where a.tryout_id = old.id
    ) then
      raise exception 'Try Out yang sudah memiliki attempt tidak dapat dihapus. Ubah status menjadi closed.';
    end if;
    return old;
  end if;

  if exists (
    select 1 from public.tryout_attempts a where a.tryout_id = old.id
  ) then
    if new.course_id <> old.course_id then
      raise exception 'Course Try Out tidak dapat diubah setelah attempt dimulai.';
    end if;

    if new.passing_score <> old.passing_score then
      raise exception 'Nilai lulus tidak dapat diubah setelah attempt dimulai.';
    end if;

    select coalesce(max(a.attempt_number), 0)
    into highest_attempt
    from public.tryout_attempts a
    where a.tryout_id = old.id;

    if new.max_attempts < highest_attempt then
      raise exception 'Maksimal percobaan tidak boleh lebih kecil dari attempt yang sudah digunakan.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_tryout_question_mutation() from public;
revoke all on function public.guard_tryout_option_mutation() from public;
revoke all on function public.guard_tryout_settings_mutation() from public;

create trigger trg_guard_tryout_question_mutation
before insert or update or delete on public.tryout_questions
for each row execute function public.guard_tryout_question_mutation();

create trigger trg_guard_tryout_option_mutation
before insert or update or delete on public.tryout_options
for each row execute function public.guard_tryout_option_mutation();

create trigger trg_guard_tryout_settings_mutation
before update or delete on public.tryouts
for each row execute function public.guard_tryout_settings_mutation();

create or replace function public.get_student_tryout_summaries(
  target_course_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if auth.uid() is null or public.current_profile_role() <> 'student' then
    raise exception 'Akses peserta diperlukan.';
  end if;

  if not exists (
    select 1
    from public.enrollments e
    where e.profile_id = auth.uid()
      and e.course_id = target_course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  ) then
    raise exception 'Anda tidak memiliki akses aktif ke course ini.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'tryout_id', t.id,
        'attempts_used', coalesce(r.attempts_used, 0),
        'best_score', case
          when t.result_release_mode = 'immediate'
            or (
              t.result_release_mode = 'after_close'
              and t.close_at is not null
              and now() >= t.close_at
            )
          then r.best_score
          else null
        end,
        'passed', case
          when t.result_release_mode = 'immediate'
            or (
              t.result_release_mode = 'after_close'
              and t.close_at is not null
              and now() >= t.close_at
            )
          then coalesce(r.passed, false)
          else false
        end,
        'result_released',
          t.result_release_mode = 'immediate'
          or (
            t.result_release_mode = 'after_close'
            and t.close_at is not null
            and now() >= t.close_at
          ),
        'active_attempt_id', active_attempt.id
      )
      order by t.open_at nulls last, t.created_at
    ),
    '[]'::jsonb
  )
  into payload
  from public.tryouts t
  left join public.tryout_results r
    on r.tryout_id = t.id
   and r.profile_id = auth.uid()
  left join lateral (
    select a.id
    from public.tryout_attempts a
    where a.tryout_id = t.id
      and a.profile_id = auth.uid()
      and a.status = 'in_progress'
      and a.expires_at > now()
    order by a.started_at desc
    limit 1
  ) active_attempt on true
  where t.course_id = target_course_id
    and t.publication_status in ('scheduled', 'published', 'closed');

  return payload;
end;
$$;

create or replace function public.get_tryout_review(
  target_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.tryout_attempts%rowtype;
  tryout_row public.tryouts%rowtype;
  review_visible boolean;
  questions_payload jsonb;
begin
  select *
  into attempt_row
  from public.tryout_attempts a
  where a.id = target_attempt_id
    and (
      a.profile_id = auth.uid()
      or public.current_profile_role() = 'admin'
    );

  if not found then
    raise exception 'Attempt Try Out tidak ditemukan.';
  end if;

  if attempt_row.status = 'in_progress' then
    raise exception 'Try Out belum selesai.';
  end if;

  select *
  into tryout_row
  from public.tryouts t
  where t.id = attempt_row.tryout_id;

  review_visible :=
    public.current_profile_role() = 'admin'
    or tryout_row.review_release_mode = 'immediate'
    or (
      tryout_row.review_release_mode = 'after_close'
      and tryout_row.close_at is not null
      and now() >= tryout_row.close_at
    );

  if not review_visible or tryout_row.review_release_mode = 'never' then
    return jsonb_build_object(
      'released', false,
      'message', case
        when tryout_row.review_release_mode = 'never'
          then 'Pembahasan tidak dipublikasikan untuk Try Out ini.'
        else 'Pembahasan akan tersedia setelah periode Try Out berakhir.'
      end
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'question_order', question_position.ordinality,
        'question', q.question,
        'image_path', q.image_path,
        'topic', q.topic,
        'difficulty', q.difficulty,
        'explanation', q.explanation,
        'explanation_image_path', q.explanation_image_path,
        'selected_option_id', answer.selected_option_id,
        'is_correct', coalesce(selected_option.is_correct, false),
        'options', coalesce(option_payload.options, '[]'::jsonb)
      )
      order by question_position.ordinality
    ),
    '[]'::jsonb
  )
  into questions_payload
  from unnest(attempt_row.question_order)
    with ordinality as question_position(question_id, ordinality)
  join public.tryout_questions q
    on q.id = question_position.question_id
  left join public.tryout_answers answer
    on answer.attempt_id = attempt_row.id
   and answer.question_id = q.id
  left join public.tryout_options selected_option
    on selected_option.id = answer.selected_option_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'option_text', o.option_text,
        'image_path', o.image_path,
        'is_correct', o.is_correct
      )
      order by option_position.ordinality
    ) as options
    from jsonb_array_elements_text(
      coalesce(attempt_row.option_orders -> q.id::text, '[]'::jsonb)
    ) with ordinality as option_position(option_id, ordinality)
    join public.tryout_options o
      on o.id = option_position.option_id::uuid
  ) option_payload on true;

  return jsonb_build_object(
    'released', true,
    'attempt_id', attempt_row.id,
    'tryout_id', tryout_row.id,
    'title', tryout_row.title,
    'score', attempt_row.score,
    'questions', questions_payload
  );
end;
$$;

create or replace function public.admin_update_tryout_question(
  target_question_id uuid,
  question_text text,
  explanation_text text,
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
  option_index integer;
begin
  if public.current_profile_role() <> 'admin' then
    raise exception 'Akses Admin diperlukan.';
  end if;

  if not exists (
    select 1 from public.tryout_questions q where q.id = target_question_id
  ) then
    raise exception 'Soal Try Out tidak ditemukan.';
  end if;

  if array_length(option_texts, 1) is null or array_length(option_texts, 1) < 2 then
    raise exception 'Minimal dua pilihan jawaban diperlukan.';
  end if;

  if correct_option_index < 1 or correct_option_index > array_length(option_texts, 1) then
    raise exception 'Jawaban benar tidak valid.';
  end if;

  update public.tryout_questions
  set
    question = btrim(question_text),
    explanation = nullif(btrim(explanation_text), ''),
    topic = coalesce(nullif(btrim(topic_text), ''), 'Umum'),
    difficulty = difficulty_text,
    points = question_points
  where id = target_question_id;

  delete from public.tryout_options
  where question_id = target_question_id;

  for option_index in 1..array_length(option_texts, 1)
  loop
    insert into public.tryout_options (
      question_id,
      option_order,
      option_text,
      is_correct
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

revoke all on function public.get_student_tryout_summaries(uuid) from public;
revoke all on function public.get_tryout_review(uuid) from public;
revoke all on function public.admin_update_tryout_question(uuid, text, text, text, text, integer, text[], integer) from public;

grant execute on function public.get_student_tryout_summaries(uuid) to authenticated;
grant execute on function public.get_tryout_review(uuid) to authenticated;
grant execute on function public.admin_update_tryout_question(uuid, text, text, text, text, integer, text[], integer) to authenticated;

commit;
