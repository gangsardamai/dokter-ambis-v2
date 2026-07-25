begin;

create table public.tryouts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title varchar(180) not null check (char_length(btrim(title)) between 1 and 180),
  description text,
  duration_minutes integer not null default 120 check (duration_minutes between 1 and 600),
  max_attempts integer not null default 1 check (max_attempts between 1 and 10),
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  open_at timestamptz,
  close_at timestamptz,
  result_release_mode text not null default 'immediate'
    check (result_release_mode in ('immediate', 'after_close')),
  review_release_mode text not null default 'after_close'
    check (review_release_mode in ('immediate', 'after_close', 'never')),
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'scheduled', 'published', 'closed')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (close_at is null or open_at is null or close_at > open_at)
);

create table public.tryout_questions (
  id uuid primary key default gen_random_uuid(),
  tryout_id uuid not null references public.tryouts(id) on delete cascade,
  question_order integer not null check (question_order > 0),
  question text not null check (char_length(btrim(question)) > 0),
  explanation text,
  image_path text,
  explanation_image_path text,
  topic varchar(120) not null default 'Umum'
    check (char_length(btrim(topic)) between 1 and 120),
  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),
  points integer not null default 1 check (points > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tryout_id, question_order)
);

create table public.tryout_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.tryout_questions(id) on delete cascade,
  option_order integer not null check (option_order > 0),
  option_text text not null check (char_length(btrim(option_text)) > 0),
  image_path text,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, option_order)
);

create table public.tryout_attempts (
  id uuid primary key default gen_random_uuid(),
  tryout_id uuid not null references public.tryouts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted', 'expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  duration_seconds integer,
  question_order uuid[] not null,
  option_orders jsonb not null default '{}'::jsonb,
  score numeric(6,2),
  total_questions integer not null default 0,
  total_correct integer not null default 0,
  total_wrong integer not null default 0,
  total_unanswered integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tryout_id, profile_id, attempt_number)
);

create unique index uq_tryout_active_attempt
  on public.tryout_attempts(tryout_id, profile_id)
  where status = 'in_progress';

create table public.tryout_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.tryout_attempts(id) on delete cascade,
  question_id uuid not null references public.tryout_questions(id) on delete cascade,
  selected_option_id uuid references public.tryout_options(id) on delete set null,
  is_marked_for_review boolean not null default false,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.tryout_results (
  id uuid primary key default gen_random_uuid(),
  tryout_id uuid not null references public.tryouts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  attempts_used integer not null default 0,
  best_score numeric(6,2),
  passed boolean not null default false,
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tryout_id, profile_id)
);

create index idx_tryouts_course_status
  on public.tryouts(course_id, publication_status, open_at, close_at);
create index idx_tryout_questions_tryout_order
  on public.tryout_questions(tryout_id, question_order);
create index idx_tryout_options_question_order
  on public.tryout_options(question_id, option_order);
create index idx_tryout_attempts_profile
  on public.tryout_attempts(profile_id, started_at desc);
create index idx_tryout_attempts_tryout
  on public.tryout_attempts(tryout_id, status, started_at desc);
create index idx_tryout_answers_attempt
  on public.tryout_answers(attempt_id, question_id);
create index idx_tryout_results_tryout_score
  on public.tryout_results(tryout_id, best_score desc);

create trigger trg_tryouts_updated_at
before update on public.tryouts
for each row execute function public.update_updated_at_column();
create trigger trg_tryout_questions_updated_at
before update on public.tryout_questions
for each row execute function public.update_updated_at_column();
create trigger trg_tryout_options_updated_at
before update on public.tryout_options
for each row execute function public.update_updated_at_column();
create trigger trg_tryout_attempts_updated_at
before update on public.tryout_attempts
for each row execute function public.update_updated_at_column();
create trigger trg_tryout_answers_updated_at
before update on public.tryout_answers
for each row execute function public.update_updated_at_column();
create trigger trg_tryout_results_updated_at
before update on public.tryout_results
for each row execute function public.update_updated_at_column();

alter table public.tryouts enable row level security;
alter table public.tryout_questions enable row level security;
alter table public.tryout_options enable row level security;
alter table public.tryout_attempts enable row level security;
alter table public.tryout_answers enable row level security;
alter table public.tryout_results enable row level security;

create policy tryouts_admin_all on public.tryouts
for all to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy tryouts_student_select on public.tryouts
for select to authenticated
using (
  public.current_profile_role() = 'student'
  and publication_status in ('scheduled', 'published', 'closed')
  and exists (
    select 1 from public.enrollments e
    where e.profile_id = auth.uid()
      and e.course_id = tryouts.course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  )
);

create policy tryout_questions_admin_all on public.tryout_questions
for all to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy tryout_options_admin_all on public.tryout_options
for all to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy tryout_attempts_admin_select on public.tryout_attempts
for select to authenticated
using (public.current_profile_role() = 'admin');

create policy tryout_attempts_student_select on public.tryout_attempts
for select to authenticated
using (
  profile_id = auth.uid()
  and (
    status = 'in_progress'
    or exists (
      select 1 from public.tryouts t
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
);

create policy tryout_answers_admin_select on public.tryout_answers
for select to authenticated
using (public.current_profile_role() = 'admin');

create policy tryout_answers_student_select on public.tryout_answers
for select to authenticated
using (
  exists (
    select 1
    from public.tryout_attempts a
    join public.tryouts t on t.id = a.tryout_id
    where a.id = tryout_answers.attempt_id
      and a.profile_id = auth.uid()
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

create policy tryout_results_admin_select on public.tryout_results
for select to authenticated
using (public.current_profile_role() = 'admin');

create policy tryout_results_student_select on public.tryout_results
for select to authenticated
using (
  profile_id = auth.uid()
  and exists (
    select 1 from public.tryouts t
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
);

grant select, insert, update, delete on public.tryouts to authenticated;
grant select, insert, update, delete on public.tryout_questions to authenticated;
grant select, insert, update, delete on public.tryout_options to authenticated;
grant select on public.tryout_attempts to authenticated;
grant select on public.tryout_answers to authenticated;
grant select on public.tryout_results to authenticated;

create or replace function public.finalize_tryout_attempt(
  target_attempt_id uuid,
  final_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.tryout_attempts%rowtype;
  tryout_row public.tryouts%rowtype;
  question_count integer;
  answered_count integer;
  correct_count integer;
  total_points integer;
  earned_points integer;
  calculated_score numeric(6,2);
  finished_at timestamptz := now();
begin
  if final_status not in ('submitted', 'expired') then
    raise exception 'Status final Try Out tidak valid.';
  end if;

  select * into attempt_row
  from public.tryout_attempts
  where id = target_attempt_id
  for update;

  if not found then
    raise exception 'Attempt Try Out tidak ditemukan.';
  end if;

  if attempt_row.status <> 'in_progress' then
    return jsonb_build_object(
      'attempt_id', attempt_row.id,
      'status', attempt_row.status,
      'score', attempt_row.score,
      'total_questions', attempt_row.total_questions,
      'total_correct', attempt_row.total_correct,
      'total_wrong', attempt_row.total_wrong,
      'total_unanswered', attempt_row.total_unanswered
    );
  end if;

  select * into tryout_row
  from public.tryouts
  where id = attempt_row.tryout_id;

  select
    count(*)::integer,
    coalesce(sum(q.points), 0)::integer,
    count(a.selected_option_id)::integer,
    count(*) filter (where o.is_correct)::integer,
    coalesce(sum(q.points) filter (where o.is_correct), 0)::integer
  into question_count, total_points, answered_count, correct_count, earned_points
  from public.tryout_questions q
  left join public.tryout_answers a
    on a.question_id = q.id
   and a.attempt_id = attempt_row.id
  left join public.tryout_options o
    on o.id = a.selected_option_id
  where q.tryout_id = attempt_row.tryout_id;

  calculated_score := case
    when total_points > 0
      then round((earned_points::numeric / total_points::numeric) * 100, 2)
    else 0
  end;

  update public.tryout_attempts
  set
    status = final_status,
    submitted_at = finished_at,
    duration_seconds = greatest(
      0,
      extract(epoch from (least(finished_at, expires_at) - started_at))::integer
    ),
    score = calculated_score,
    total_questions = question_count,
    total_correct = correct_count,
    total_wrong = greatest(answered_count - correct_count, 0),
    total_unanswered = greatest(question_count - answered_count, 0)
  where id = attempt_row.id
  returning * into attempt_row;

  insert into public.tryout_results (
    tryout_id,
    profile_id,
    attempts_used,
    best_score,
    passed,
    first_attempt_at,
    last_attempt_at
  ) values (
    attempt_row.tryout_id,
    attempt_row.profile_id,
    attempt_row.attempt_number,
    calculated_score,
    calculated_score >= tryout_row.passing_score,
    attempt_row.started_at,
    finished_at
  )
  on conflict (tryout_id, profile_id)
  do update set
    attempts_used = greatest(public.tryout_results.attempts_used, excluded.attempts_used),
    best_score = greatest(coalesce(public.tryout_results.best_score, 0), excluded.best_score),
    passed = public.tryout_results.passed or excluded.passed,
    first_attempt_at = coalesce(public.tryout_results.first_attempt_at, excluded.first_attempt_at),
    last_attempt_at = excluded.last_attempt_at,
    updated_at = now();

  return jsonb_build_object(
    'attempt_id', attempt_row.id,
    'tryout_id', attempt_row.tryout_id,
    'status', attempt_row.status,
    'score', attempt_row.score,
    'passing_score', tryout_row.passing_score,
    'passed', attempt_row.score >= tryout_row.passing_score,
    'total_questions', attempt_row.total_questions,
    'total_correct', attempt_row.total_correct,
    'total_wrong', attempt_row.total_wrong,
    'total_unanswered', attempt_row.total_unanswered,
    'duration_seconds', attempt_row.duration_seconds
  );
end;
$$;

revoke all on function public.finalize_tryout_attempt(uuid, text) from public;

create or replace function public.start_tryout_attempt(target_tryout_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tryout_row public.tryouts%rowtype;
  existing_attempt public.tryout_attempts%rowtype;
  new_attempt public.tryout_attempts%rowtype;
  next_attempt integer;
  question_ids uuid[];
  options_snapshot jsonb;
begin
  if auth.uid() is null or public.current_profile_role() <> 'student' then
    raise exception 'Hanya peserta yang dapat memulai Try Out.';
  end if;

  select * into tryout_row
  from public.tryouts
  where id = target_tryout_id;

  if not found then
    raise exception 'Try Out tidak ditemukan.';
  end if;

  if tryout_row.publication_status not in ('scheduled', 'published') then
    raise exception 'Try Out belum tersedia.';
  end if;

  if tryout_row.open_at is not null and now() < tryout_row.open_at then
    raise exception 'Try Out belum dibuka.';
  end if;

  if tryout_row.close_at is not null and now() >= tryout_row.close_at then
    raise exception 'Periode Try Out telah berakhir.';
  end if;

  if not exists (
    select 1 from public.enrollments e
    where e.profile_id = auth.uid()
      and e.course_id = tryout_row.course_id
      and e.status = 'active'
      and (e.expired_at is null or e.expired_at > now())
  ) then
    raise exception 'Anda tidak memiliki akses aktif ke course ini.';
  end if;

  select * into existing_attempt
  from public.tryout_attempts
  where tryout_id = target_tryout_id
    and profile_id = auth.uid()
    and status = 'in_progress'
  order by started_at desc
  limit 1;

  if found then
    if existing_attempt.expires_at <= now() then
      perform public.finalize_tryout_attempt(existing_attempt.id, 'expired');
    else
      return jsonb_build_object(
        'attempt_id', existing_attempt.id,
        'resumed', true
      );
    end if;
  end if;

  select coalesce(max(attempt_number), 0) + 1
  into next_attempt
  from public.tryout_attempts
  where tryout_id = target_tryout_id
    and profile_id = auth.uid();

  if next_attempt > tryout_row.max_attempts then
    raise exception 'Batas percobaan Try Out telah habis.';
  end if;

  if not exists (
    select 1 from public.tryout_questions q
    where q.tryout_id = target_tryout_id
  ) then
    raise exception 'Soal Try Out belum tersedia.';
  end if;

  if exists (
    select 1
    from public.tryout_questions q
    left join public.tryout_options o on o.question_id = q.id
    where q.tryout_id = target_tryout_id
    group by q.id
    having count(o.id) < 2
       or count(o.id) filter (where o.is_correct) <> 1
  ) then
    raise exception 'Setiap soal harus memiliki minimal dua opsi dan tepat satu jawaban benar.';
  end if;

  select array_agg(q.id order by
    case when tryout_row.shuffle_questions then random() else q.question_order::double precision end
  )
  into question_ids
  from public.tryout_questions q
  where q.tryout_id = target_tryout_id;

  select coalesce(jsonb_object_agg(snapshot.question_id::text, snapshot.option_ids), '{}'::jsonb)
  into options_snapshot
  from (
    select
      q.id as question_id,
      (
        select jsonb_agg(o.id order by
          case when tryout_row.shuffle_options then random() else o.option_order::double precision end
        )
        from public.tryout_options o
        where o.question_id = q.id
      ) as option_ids
    from public.tryout_questions q
    where q.tryout_id = target_tryout_id
  ) snapshot;

  insert into public.tryout_attempts (
    tryout_id,
    profile_id,
    attempt_number,
    expires_at,
    question_order,
    option_orders
  ) values (
    target_tryout_id,
    auth.uid(),
    next_attempt,
    now() + make_interval(mins => tryout_row.duration_minutes),
    question_ids,
    options_snapshot
  )
  returning * into new_attempt;

  return jsonb_build_object(
    'attempt_id', new_attempt.id,
    'resumed', false
  );
end;
$$;

create or replace function public.get_tryout_attempt(target_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.tryout_attempts%rowtype;
  tryout_row public.tryouts%rowtype;
  question_id uuid;
  question_row public.tryout_questions%rowtype;
  options_payload jsonb;
  selected_option uuid;
  marked boolean;
  questions_payload jsonb := '[]'::jsonb;
begin
  select * into attempt_row
  from public.tryout_attempts
  where id = target_attempt_id
    and profile_id = auth.uid();

  if not found then
    raise exception 'Attempt Try Out tidak ditemukan.';
  end if;

  select * into tryout_row
  from public.tryouts
  where id = attempt_row.tryout_id;

  if attempt_row.status = 'in_progress' and attempt_row.expires_at <= now() then
    return jsonb_build_object(
      'status', 'expired',
      'result', public.finalize_tryout_attempt(attempt_row.id, 'expired')
    );
  end if;

  if attempt_row.status <> 'in_progress' then
    return jsonb_build_object(
      'status', attempt_row.status,
      'attempt_id', attempt_row.id
    );
  end if;

  foreach question_id in array attempt_row.question_order
  loop
    select * into question_row
    from public.tryout_questions
    where id = question_id;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id,
      'option_text', o.option_text,
      'image_path', o.image_path
    ) order by option_position.ordinality), '[]'::jsonb)
    into options_payload
    from jsonb_array_elements_text(
      coalesce(attempt_row.option_orders -> question_id::text, '[]'::jsonb)
    ) with ordinality as option_position(option_id, ordinality)
    join public.tryout_options o
      on o.id = option_position.option_id::uuid;

    select a.selected_option_id, a.is_marked_for_review
    into selected_option, marked
    from public.tryout_answers a
    where a.attempt_id = attempt_row.id
      and a.question_id = question_id;

    questions_payload := questions_payload || jsonb_build_array(jsonb_build_object(
      'id', question_row.id,
      'question', question_row.question,
      'image_path', question_row.image_path,
      'topic', question_row.topic,
      'options', options_payload,
      'selected_option_id', selected_option,
      'is_marked_for_review', coalesce(marked, false)
    ));
  end loop;

  return jsonb_build_object(
    'status', 'in_progress',
    'attempt_id', attempt_row.id,
    'tryout_id', tryout_row.id,
    'title', tryout_row.title,
    'attempt_number', attempt_row.attempt_number,
    'expires_at', attempt_row.expires_at,
    'remaining_seconds', greatest(0, extract(epoch from (attempt_row.expires_at - now()))::integer),
    'questions', questions_payload
  );
end;
$$;

create or replace function public.save_tryout_answer(
  target_attempt_id uuid,
  target_question_id uuid,
  target_option_id uuid,
  marked_for_review boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.tryout_attempts%rowtype;
begin
  select * into attempt_row
  from public.tryout_attempts
  where id = target_attempt_id
    and profile_id = auth.uid()
  for update;

  if not found then
    raise exception 'Attempt Try Out tidak ditemukan.';
  end if;

  if attempt_row.status <> 'in_progress' then
    raise exception 'Attempt Try Out sudah selesai.';
  end if;

  if attempt_row.expires_at <= now() then
    perform public.finalize_tryout_attempt(attempt_row.id, 'expired');
    raise exception 'Waktu Try Out telah habis.';
  end if;

  if not (target_question_id = any(attempt_row.question_order)) then
    raise exception 'Soal tidak termasuk dalam attempt ini.';
  end if;

  if target_option_id is not null and not exists (
    select 1 from public.tryout_options o
    where o.id = target_option_id
      and o.question_id = target_question_id
  ) then
    raise exception 'Pilihan jawaban tidak valid.';
  end if;

  insert into public.tryout_answers (
    attempt_id,
    question_id,
    selected_option_id,
    is_marked_for_review,
    answered_at
  ) values (
    target_attempt_id,
    target_question_id,
    target_option_id,
    marked_for_review,
    case when target_option_id is null then null else now() end
  )
  on conflict (attempt_id, question_id)
  do update set
    selected_option_id = excluded.selected_option_id,
    is_marked_for_review = excluded.is_marked_for_review,
    answered_at = excluded.answered_at,
    updated_at = now();

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.submit_tryout_attempt(target_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.tryout_attempts%rowtype;
  final_state text;
begin
  select * into attempt_row
  from public.tryout_attempts
  where id = target_attempt_id
    and profile_id = auth.uid();

  if not found then
    raise exception 'Attempt Try Out tidak ditemukan.';
  end if;

  final_state := case
    when attempt_row.expires_at <= now() then 'expired'
    else 'submitted'
  end;

  return public.finalize_tryout_attempt(attempt_row.id, final_state);
end;
$$;

create or replace function public.get_tryout_result(target_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.tryout_attempts%rowtype;
  tryout_row public.tryouts%rowtype;
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

  result_visible :=
    public.current_profile_role() = 'admin'
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

create or replace function public.admin_create_tryout_question(
  target_tryout_id uuid,
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
  new_question_id uuid;
  next_order integer;
  option_index integer;
begin
  if public.current_profile_role() <> 'admin' then
    raise exception 'Akses Admin diperlukan.';
  end if;

  if array_length(option_texts, 1) is null or array_length(option_texts, 1) < 2 then
    raise exception 'Minimal dua pilihan jawaban diperlukan.';
  end if;

  if correct_option_index < 1 or correct_option_index > array_length(option_texts, 1) then
    raise exception 'Jawaban benar tidak valid.';
  end if;

  select coalesce(max(question_order), 0) + 1
  into next_order
  from public.tryout_questions
  where tryout_id = target_tryout_id;

  insert into public.tryout_questions (
    tryout_id,
    question_order,
    question,
    explanation,
    topic,
    difficulty,
    points
  ) values (
    target_tryout_id,
    next_order,
    btrim(question_text),
    nullif(btrim(explanation_text), ''),
    coalesce(nullif(btrim(topic_text), ''), 'Umum'),
    difficulty_text,
    question_points
  )
  returning id into new_question_id;

  for option_index in 1..array_length(option_texts, 1)
  loop
    insert into public.tryout_options (
      question_id,
      option_order,
      option_text,
      is_correct
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

revoke all on function public.start_tryout_attempt(uuid) from public;
revoke all on function public.get_tryout_attempt(uuid) from public;
revoke all on function public.save_tryout_answer(uuid, uuid, uuid, boolean) from public;
revoke all on function public.submit_tryout_attempt(uuid) from public;
revoke all on function public.get_tryout_result(uuid) from public;
revoke all on function public.admin_create_tryout_question(uuid, text, text, text, text, integer, text[], integer) from public;

grant execute on function public.start_tryout_attempt(uuid) to authenticated;
grant execute on function public.get_tryout_attempt(uuid) to authenticated;
grant execute on function public.save_tryout_answer(uuid, uuid, uuid, boolean) to authenticated;
grant execute on function public.submit_tryout_attempt(uuid) to authenticated;
grant execute on function public.get_tryout_result(uuid) to authenticated;
grant execute on function public.admin_create_tryout_question(uuid, text, text, text, text, integer, text[], integer) to authenticated;

commit;
