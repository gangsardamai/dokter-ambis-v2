begin;

create or replace function public.guard_tryout_image_path_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_course_id uuid;
  plain_question_pattern text;
  r2_question_pattern text;
  plain_explanation_pattern text;
  r2_explanation_pattern text;
begin
  select t.course_id
  into target_course_id
  from public.tryouts t
  where t.id = new.tryout_id;

  if target_course_id is null then
    raise exception 'Course Try Out tidak ditemukan.';
  end if;

  new.image_path := nullif(btrim(new.image_path), '');
  new.explanation_image_path := nullif(
    btrim(new.explanation_image_path),
    ''
  );

  plain_question_pattern :=
    '^' || target_course_id::text || '/tryout-images/' ||
    new.tryout_id::text || '/question/[^/]+$';
  r2_question_pattern :=
    '^r2://[^/]+/courses/' || target_course_id::text || '/tryout-images/' ||
    new.tryout_id::text || '/question/[^/]+$';
  plain_explanation_pattern :=
    '^' || target_course_id::text || '/tryout-images/' ||
    new.tryout_id::text || '/explanation/[^/]+$';
  r2_explanation_pattern :=
    '^r2://[^/]+/courses/' || target_course_id::text || '/tryout-images/' ||
    new.tryout_id::text || '/explanation/[^/]+$';

  if new.image_path is not null
     and new.image_path !~ plain_question_pattern
     and new.image_path !~ r2_question_pattern then
    raise exception 'Path gambar soal tidak sesuai Course dan Try Out.';
  end if;

  if new.explanation_image_path is not null
     and new.explanation_image_path !~ plain_explanation_pattern
     and new.explanation_image_path !~ r2_explanation_pattern then
    raise exception 'Path gambar pembahasan tidak sesuai Course dan Try Out.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_tryout_image_path_scope() from public;

-- Abort instead of silently accepting legacy paths outside the scoped folders.
do $$
begin
  if exists (
    select 1
    from public.tryout_questions q
    join public.tryouts t on t.id = q.tryout_id
    where q.image_path is not null
      and btrim(q.image_path) <> ''
      and btrim(q.image_path) !~ (
        '^' || t.course_id::text || '/tryout-images/' || t.id::text ||
        '/question/[^/]+$'
      )
      and btrim(q.image_path) !~ (
        '^r2://[^/]+/courses/' || t.course_id::text || '/tryout-images/' ||
        t.id::text || '/question/[^/]+$'
      )
  ) then
    raise exception 'Terdapat path gambar soal lama yang tidak valid.';
  end if;

  if exists (
    select 1
    from public.tryout_questions q
    join public.tryouts t on t.id = q.tryout_id
    where q.explanation_image_path is not null
      and btrim(q.explanation_image_path) <> ''
      and btrim(q.explanation_image_path) !~ (
        '^' || t.course_id::text || '/tryout-images/' || t.id::text ||
        '/explanation/[^/]+$'
      )
      and btrim(q.explanation_image_path) !~ (
        '^r2://[^/]+/courses/' || t.course_id::text || '/tryout-images/' ||
        t.id::text || '/explanation/[^/]+$'
      )
  ) then
    raise exception 'Terdapat path gambar pembahasan lama yang tidak valid.';
  end if;
end;
$$;

drop trigger if exists trg_guard_tryout_image_path_scope
  on public.tryout_questions;

create trigger trg_guard_tryout_image_path_scope
before insert or update of tryout_id, image_path, explanation_image_path
on public.tryout_questions
for each row execute function public.guard_tryout_image_path_scope();

commit;
