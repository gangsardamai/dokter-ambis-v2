create or replace function public.guard_tryout_settings_mutation()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  highest_attempt integer;
begin
  if tg_op = 'DELETE' then
    -- Deleting a Try Out is an explicit destructive action from the manager UI.
    -- Remove attempts first so the question/option mutation guards do not block
    -- the FK cascade that follows. tryout_answers are removed by cascade from
    -- tryout_attempts; questions/options/results are removed by cascade from
    -- tryouts.
    delete from public.tryout_attempts a
    where a.tryout_id = old.id;

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
$function$;
