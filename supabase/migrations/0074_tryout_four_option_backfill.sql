begin;

-- Existing five-option questions may only be normalized before the first attempt.
do $$
begin
  if exists (
    select 1
    from public.tryout_questions q
    join public.tryout_options o on o.question_id = q.id
    where o.option_order > 4
      and exists (
        select 1
        from public.tryout_attempts a
        where a.tryout_id = q.tryout_id
      )
  ) then
    raise exception 'Try Out dengan opsi E sudah memiliki attempt dan tidak dapat dinormalisasi otomatis.';
  end if;

  if exists (
    select 1
    from public.tryout_questions q
    join public.tryout_options o on o.question_id = q.id
    where o.option_order > 4
      and o.is_correct
  ) then
    raise exception 'Terdapat soal lama dengan opsi E sebagai jawaban benar. Perbaiki manual sebelum migration.';
  end if;
end;
$$;

delete from public.tryout_options o
using public.tryout_questions q
where q.id = o.question_id
  and o.option_order > 4
  and not exists (
    select 1
    from public.tryout_attempts a
    where a.tryout_id = q.tryout_id
  );

-- Every existing question must now have exactly A-D and one correct answer.
do $$
begin
  if exists (
    select 1
    from public.tryout_questions q
    left join public.tryout_options o on o.question_id = q.id
    group by q.id
    having count(o.id) <> 4
       or count(o.id) filter (where o.is_correct) <> 1
       or min(o.option_order) <> 1
       or max(o.option_order) <> 4
  ) then
    raise exception 'Struktur pilihan Try Out belum konsisten sebagai A-D.';
  end if;
end;
$$;

commit;
