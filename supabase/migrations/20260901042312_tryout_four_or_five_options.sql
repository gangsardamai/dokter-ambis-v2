begin;

alter table public.tryout_options
  drop constraint if exists tryout_options_option_order_check;

alter table public.tryout_options
  add constraint tryout_options_option_order_check
  check (option_order between 1 and 5);

create or replace function public.admin_create_tryout_question(
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
set search_path = ''
as $$
declare
  new_question_id uuid;
  next_order integer;
  option_count integer;
  option_index integer;
begin
  if not public.can_manage_tryout(target_tryout_id) then
    raise exception 'Anda tidak dapat mengelola Try Out ini.';
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

  select coalesce(max(q.question_order), 0) + 1
  into next_order
  from public.tryout_questions q
  where q.tryout_id = target_tryout_id;

  insert into public.tryout_questions (
    tryout_id,
    question_order,
    question,
    explanation,
    image_path,
    explanation_image_path,
    topic,
    difficulty,
    points
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

  for option_index in 1..option_count loop
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

create or replace function public.admin_update_tryout_question(
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
set search_path = ''
as $$
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
    explanation_image_path = nullif(btrim(explanation_image_path), ''),
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
$$;

create or replace function private.enforce_tryout_question_option_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_question_id uuid;
  option_count integer;
  correct_count integer;
  minimum_order integer;
  maximum_order integer;
begin
  if tg_table_name = 'tryout_questions' then
    if tg_op = 'DELETE' then
      target_question_id := old.id;
    else
      target_question_id := new.id;
    end if;
  elsif tg_op = 'DELETE' then
    target_question_id := old.question_id;
  else
    target_question_id := new.question_id;
  end if;

  if not exists (
    select 1
    from public.tryout_questions q
    where q.id = target_question_id
  ) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select
    count(*)::integer,
    count(*) filter (where o.is_correct)::integer,
    min(o.option_order),
    max(o.option_order)
  into option_count, correct_count, minimum_order, maximum_order
  from public.tryout_options o
  where o.question_id = target_question_id;

  if option_count not in (4, 5)
     or correct_count <> 1
     or minimum_order <> 1
     or maximum_order <> option_count then
    raise exception 'Setiap soal Try Out wajib memiliki pilihan A-D atau A-E dan tepat satu jawaban benar.'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tryout_question_four_options_from_options
  on public.tryout_options;
drop trigger if exists trg_tryout_question_four_options_from_question
  on public.tryout_questions;
drop trigger if exists trg_tryout_question_option_count_from_options
  on public.tryout_options;
drop trigger if exists trg_tryout_question_option_count_from_question
  on public.tryout_questions;

create constraint trigger trg_tryout_question_option_count_from_options
after insert or update or delete on public.tryout_options
deferrable initially deferred
for each row execute function private.enforce_tryout_question_option_count();

create constraint trigger trg_tryout_question_option_count_from_question
after insert or update on public.tryout_questions
deferrable initially deferred
for each row execute function private.enforce_tryout_question_option_count();

drop function if exists private.enforce_tryout_question_four_options();

revoke all on function public.admin_create_tryout_question(
  uuid, text, text, text, text, text, text, integer, text[], integer
) from public, anon;
revoke all on function public.admin_update_tryout_question(
  uuid, text, text, text, text, text, text, integer, text[], integer
) from public, anon;
revoke all on function private.enforce_tryout_question_option_count()
  from public, anon, authenticated;

grant execute on function public.admin_create_tryout_question(
  uuid, text, text, text, text, text, text, integer, text[], integer
) to authenticated;
grant execute on function public.admin_update_tryout_question(
  uuid, text, text, text, text, text, text, integer, text[], integer
) to authenticated;

commit;
