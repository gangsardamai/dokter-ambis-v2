-- Restore deployed RPC definitions missing from repository history.
-- Preserve signatures and empty search_path; CREATE OR REPLACE retains privileges.
CREATE OR REPLACE FUNCTION public.admin_update_tryout_question(target_question_id uuid, question_text text, explanation_text text, question_image_path text, explanation_image_path text, topic_text text, difficulty_text text, question_points integer, option_texts text[], correct_option_index integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  target_tryout_id uuid;
  option_count integer;
  option_index integer;
begin
  select q.tryout_id
  into target_tryout_id
  from public.tryout_questions q
  where q.id = target_question_id;

  if target_tryout_id is null
     or not public.can_manage_tryout(target_tryout_id) then
    raise exception 'Soal Try Out tidak ditemukan atau tidak dapat Anda kelola.';
  end if;

  if char_length(btrim(question_text)) = 0 then
    raise exception 'Pertanyaan wajib diisi.';
  end if;

  option_count := array_length(option_texts, 1);
  if option_count not in (4, 5)
     or exists (
       select 1
       from unnest(option_texts) as option_value(value)
       where char_length(btrim(value)) = 0
     ) then
    raise exception 'Pilihan jawaban wajib terdiri dari A-D atau A-E.';
  end if;

  if correct_option_index < 1 or correct_option_index > option_count then
    raise exception 'Jawaban benar harus sesuai dengan jumlah pilihan.';
  end if;

  update public.tryout_questions
  set
    question = btrim(question_text),
    explanation = nullif(btrim(explanation_text), ''),
    image_path = nullif(btrim(question_image_path), ''),
    explanation_image_path = nullif(btrim(admin_update_tryout_question.explanation_image_path), ''),
    topic = coalesce(nullif(btrim(topic_text), ''), 'Umum'),
    difficulty = difficulty_text,
    points = question_points
  where id = target_question_id;

  delete from public.tryout_options
  where question_id = target_question_id;

  for option_index in 1..option_count loop
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
$function$;


CREATE OR REPLACE FUNCTION public.get_tryout_attempt(target_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  attempt_row public.tryout_attempts%rowtype;
  tryout_row public.tryouts%rowtype;
  current_question_id uuid;
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

  foreach current_question_id in array attempt_row.question_order
  loop
    select * into question_row
    from public.tryout_questions
    where id = current_question_id;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id,
      'option_text', o.option_text,
      'image_path', o.image_path
    ) order by option_position.ordinality), '[]'::jsonb)
    into options_payload
    from jsonb_array_elements_text(
      coalesce(attempt_row.option_orders -> current_question_id::text, '[]'::jsonb)
    ) with ordinality as option_position(option_id, ordinality)
    join public.tryout_options o
      on o.id = option_position.option_id::uuid;

    select a.selected_option_id, a.is_marked_for_review
    into selected_option, marked
    from public.tryout_answers a
    where a.attempt_id = attempt_row.id
      and a.question_id = current_question_id;

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
$function$;
