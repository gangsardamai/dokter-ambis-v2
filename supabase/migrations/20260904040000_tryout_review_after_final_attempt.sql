begin;

create or replace function public.get_student_tryout_summaries(
  target_course_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
          when coalesce(r.attempts_used, 0) >= t.max_attempts
            or t.result_release_mode = 'immediate'
            or (
              t.result_release_mode = 'after_close'
              and t.close_at is not null
              and now() >= t.close_at
            )
          then r.best_score
          else null
        end,
        'passed', case
          when coalesce(r.attempts_used, 0) >= t.max_attempts
            or t.result_release_mode = 'immediate'
            or (
              t.result_release_mode = 'after_close'
              and t.close_at is not null
              and now() >= t.close_at
            )
          then coalesce(r.passed, false)
          else false
        end,
        'result_released',
          coalesce(r.attempts_used, 0) >= t.max_attempts
          or t.result_release_mode = 'immediate'
          or (
            t.result_release_mode = 'after_close'
            and t.close_at is not null
            and now() >= t.close_at
          ),
        'review_released',
          coalesce(r.attempts_used, 0) >= t.max_attempts
          or t.review_release_mode = 'immediate'
          or (
            t.review_release_mode = 'after_close'
            and t.close_at is not null
            and now() >= t.close_at
          ),
        'active_attempt_id', active_attempt.id,
        'completed_attempts', coalesce(
          completed_attempt.items,
          '[]'::jsonb
        )
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
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'attempt_id', a.id,
        'attempt_number', a.attempt_number,
        'score', case
          when coalesce(r.attempts_used, 0) >= t.max_attempts
            or t.result_release_mode = 'immediate'
            or (
              t.result_release_mode = 'after_close'
              and t.close_at is not null
              and now() >= t.close_at
            )
          then a.score
          else null
        end,
        'status', a.status,
        'submitted_at', a.submitted_at
      )
      order by a.attempt_number
    ) as items
    from public.tryout_attempts a
    where a.tryout_id = t.id
      and a.profile_id = auth.uid()
      and a.status in ('submitted', 'expired')
  ) completed_attempt on true
  where t.course_id = target_course_id
    and t.publication_status in ('scheduled', 'published', 'closed');

  return payload;
end;
$$;

create or replace function public.get_tryout_result(target_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_row public.tryout_attempts%rowtype;
  tryout_row public.tryouts%rowtype;
  attempt_limit_reached boolean;
  result_visible boolean;
  review_visible boolean;
begin
  select * into attempt_row
  from public.tryout_attempts
  where id = target_attempt_id
    and (
      profile_id = auth.uid()
      or public.current_profile_role() = 'admin'
    );

  if not found then
    raise exception 'Hasil Try Out tidak ditemukan.';
  end if;

  if attempt_row.status = 'in_progress' then
    raise exception 'Try Out belum selesai.';
  end if;

  select * into tryout_row
  from public.tryouts
  where id = attempt_row.tryout_id;

  select count(*) >= tryout_row.max_attempts
  into attempt_limit_reached
  from public.tryout_attempts a
  where a.tryout_id = attempt_row.tryout_id
    and a.profile_id = attempt_row.profile_id
    and a.status in ('submitted', 'expired');

  result_visible :=
    public.current_profile_role() = 'admin'
    or attempt_limit_reached
    or tryout_row.result_release_mode = 'immediate'
    or (
      tryout_row.result_release_mode = 'after_close'
      and tryout_row.close_at is not null
      and now() >= tryout_row.close_at
    );

  if not result_visible then
    return jsonb_build_object(
      'released', false,
      'message', 'Nilai akan tersedia setelah periode Try Out berakhir.'
    );
  end if;

  review_visible :=
    public.current_profile_role() = 'admin'
    or attempt_limit_reached
    or tryout_row.review_release_mode = 'immediate'
    or (
      tryout_row.review_release_mode = 'after_close'
      and tryout_row.close_at is not null
      and now() >= tryout_row.close_at
    );

  return jsonb_build_object(
    'released', true,
    'attempt_id', attempt_row.id,
    'tryout_id', tryout_row.id,
    'title', tryout_row.title,
    'score', attempt_row.score,
    'passing_score', tryout_row.passing_score,
    'passed', attempt_row.score >= tryout_row.passing_score,
    'status', attempt_row.status,
    'total_questions', attempt_row.total_questions,
    'total_correct', attempt_row.total_correct,
    'total_wrong', attempt_row.total_wrong,
    'total_unanswered', attempt_row.total_unanswered,
    'duration_seconds', attempt_row.duration_seconds,
    'review_available', review_visible
  );
end;
$$;

create or replace function public.get_tryout_review(target_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_row public.tryout_attempts%rowtype;
  tryout_row public.tryouts%rowtype;
  attempt_limit_reached boolean;
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

  select count(*) >= tryout_row.max_attempts
  into attempt_limit_reached
  from public.tryout_attempts a
  where a.tryout_id = attempt_row.tryout_id
    and a.profile_id = attempt_row.profile_id
    and a.status in ('submitted', 'expired');

  review_visible :=
    public.current_profile_role() = 'admin'
    or attempt_limit_reached
    or tryout_row.review_release_mode = 'immediate'
    or (
      tryout_row.review_release_mode = 'after_close'
      and tryout_row.close_at is not null
      and now() >= tryout_row.close_at
    );

  if not review_visible then
    return jsonb_build_object(
      'released', false,
      'message', case
        when tryout_row.review_release_mode = 'never'
          then 'Pembahasan tersedia setelah seluruh kesempatan mengerjakan digunakan.'
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

revoke all on function public.get_student_tryout_summaries(uuid) from public;
revoke all on function public.get_tryout_result(uuid) from public;
revoke all on function public.get_tryout_review(uuid) from public;

grant execute on function public.get_student_tryout_summaries(uuid) to authenticated;
grant execute on function public.get_tryout_result(uuid) to authenticated;
grant execute on function public.get_tryout_review(uuid) to authenticated;

commit;
