-- Archived from production migration history.
-- Production version: 20260726145243
-- Production name: 0071_tryout_mentor_images_messages
-- Intentionally stored outside supabase/migrations so migration tooling does not replay it.

-- 0071: mentor-owned Try Out, A-D questions, image paths, and assigned-course messaging

alter table public.tryout_questions
  add column if not exists image_path text,
  add column if not exists explanation_image_path text;

-- Mentor assignments must belong to an active mentor profile.
create or replace function public.is_assigned_mentor(
  target_profile_id uuid,
  target_course_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.mentor_details md
    join public.course_mentors cm on cm.mentor_id = md.id
    join public.profiles p on p.id = md.profile_id
    where md.profile_id = target_profile_id
      and cm.course_id = target_course_id
      and p.role = 'mentor'::public.profile_role
      and p.status = 'active'::public.profile_status
  );
$$;

create or replace function public.can_manage_tryout(target_tryout_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tryouts t
    where t.id = target_tryout_id
      and (
        (select public.current_profile_role()) = 'admin'::public.profile_role
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and t.created_by = (select auth.uid())
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  );
$$;

-- Normalize legacy five-option data only when it is safe.
do $$
begin
  if exists (
    select 1
    from public.tryout_options o
    join public.tryout_questions q on q.id = o.question_id
    where o.option_order > 4
      and (
        o.is_correct
        or exists (
          select 1
          from public.tryout_attempts a
          where a.tryout_id = q.tryout_id
        )
      )
  ) then
    raise exception 'Normalisasi A-D dihentikan: opsi tambahan adalah jawaban benar atau Try Out sudah memiliki attempt.';
  end if;
end;
$$;

delete from public.tryout_options
where option_order > 4;

alter table public.tryout_options
  drop constraint if exists tryout_options_option_order_check;

alter table public.tryout_options
  add constraint tryout_options_option_order_check
  check (option_order between 1 and 4);

-- Ensure messages may be sent by assigned mentors as well as students/admins.
alter table public.lesson_message_entries
  drop constraint if exists chk_lesson_message_sender_role;

alter table public.lesson_message_entries
  add constraint chk_lesson_message_sender_role
  check (sender_role in (
    'student'::public.profile_role,
    'mentor'::public.profile_role,
    'admin'::public.profile_role
  ));

create or replace function public.sync_lesson_message_thread_after_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.lesson_message_threads
  set
    status = case
      when new.sender_role in (
        'admin'::public.profile_role,
        'mentor'::public.profile_role
      ) then 'answered'
      else 'open'
    end,
    last_message_at = new.created_at,
    updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

-- Limit profile summaries to Admin or students in a Mentor's assigned courses.
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
set search_path = ''
as $$
begin
  if (select public.current_profile_role()) = 'admin'::public.profile_role then
    return query
    select p.id, p.full_name::text, p.university_origin::text
    from public.profiles p
    where p.id = any(coalesce(target_profile_ids, array[]::uuid[]));
    return;
  end if;

  if (select public.current_profile_role()) <> 'mentor'::public.profile_role then
    raise exception 'Akses pengelola diperlukan.' using errcode = '42501';
  end if;

  return query
  select p.id, p.full_name::text, p.university_origin::text
  from public.profiles p
  where p.id = any(coalesce(target_profile_ids, array[]::uuid[]))
    and exists (
      select 1
      from public.lesson_message_threads t
      where t.student_profile_id = p.id
        and public.is_assigned_mentor((select auth.uid()), t.course_id)
    );
end;
$$;

-- Validate that a stored image belongs to the same course, Try Out, and image kind.
create or replace function private.guard_tryout_question_image_paths()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_course_id uuid;
  question_prefix text;
  explanation_prefix text;
  r2_question_pattern text;
  r2_explanation_pattern text;
begin
  select t.course_id
  into target_course_id
  from public.tryouts t
  where t.id = new.tryout_id;

  if target_course_id is null then
    raise exception 'Try Out untuk gambar soal tidak ditemukan.' using errcode = '23503';
  end if;

  question_prefix := target_course_id::text || '/quiz-images/' || new.tryout_id::text || '/question/';
  explanation_prefix := target_course_id::text || '/quiz-images/' || new.tryout_id::text || '/explanation/';
  r2_question_pattern := 'r2://%/courses/' || target_course_id::text || '/quiz-images/' || new.tryout_id::text || '/question/%';
  r2_explanation_pattern := 'r2://%/courses/' || target_course_id::text || '/quiz-images/' || new.tryout_id::text || '/explanation/%';

  if new.image_path is not null then
    new.image_path := btrim(new.image_path);
    if new.image_path = ''
       or position('..' in new.image_path) > 0
       or not (
         new.image_path like question_prefix || '%'
         or new.image_path like r2_question_pattern
       )
       or lower(new.image_path) !~ '\.(jpg|jpeg|png|webp)$' then
      raise exception 'Path gambar soal tidak valid untuk course dan Try Out ini.' using errcode = '22023';
    end if;
  end if;

  if new.explanation_image_path is not null then
    new.explanation_image_path := btrim(new.explanation_image_path);
    if new.explanation_image_path = ''
       or position('..' in new.explanation_image_path) > 0
       or not (
         new.explanation_image_path like explanation_prefix || '%'
         or new.explanation_image_path like r2_explanation_pattern
       )
       or lower(new.explanation_image_path) !~ '\.(jpg|jpeg|png|webp)$' then
      raise exception 'Path gambar pembahasan tidak valid untuk course dan Try Out ini.' using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_tryout_question_image_paths() from public;

DROP TRIGGER IF EXISTS trg_guard_tryout_question_image_paths ON public.tryout_questions;
create trigger trg_guard_tryout_question_image_paths
before insert or update of tryout_id, image_path, explanation_image_path
on public.tryout_questions
for each row execute function private.guard_tryout_question_image_paths();

-- Recreate ownership-aware Try Out policies.
drop policy if exists tryouts_select on public.tryouts;
create policy tryouts_select
on public.tryouts
for select
to authenticated
using (
  (select public.current_profile_role()) = 'admin'::public.profile_role
  or (
    (select public.current_profile_role()) = 'mentor'::public.profile_role
    and created_by = (select auth.uid())
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
  or (
    (select public.current_profile_role()) = 'student'::public.profile_role
    and publication_status in ('scheduled', 'published', 'closed')
    and exists (
      select 1
      from public.enrollments e
      where e.profile_id = (select auth.uid())
        and e.course_id = tryouts.course_id
        and e.status = 'active'::public.enrollment_status
        and (e.expired_at is null or e.expired_at > now())
    )
  )
);

drop policy if exists tryouts_manager_insert on public.tryouts;
create policy tryouts_manager_insert
on public.tryouts
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (select public.current_profile_role()) = 'admin'::public.profile_role
    or (
      (select public.current_profile_role()) = 'mentor'::public.profile_role
      and public.is_assigned_mentor((select auth.uid()), course_id)
    )
  )
);

drop policy if exists tryouts_manager_update on public.tryouts;
create policy tryouts_manager_update
on public.tryouts
for update
to authenticated
using (
  (select public.current_profile_role()) = 'admin'::public.profile_role
  or (
    (select public.current_profile_role()) = 'mentor'::public.profile_role
    and created_by = (select auth.uid())
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
)
with check (
  (select public.current_profile_role()) = 'admin'::public.profile_role
  or (
    (select public.current_profile_role()) = 'mentor'::public.profile_role
    and created_by = (select auth.uid())
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
);

drop policy if exists tryouts_manager_delete on public.tryouts;
create policy tryouts_manager_delete
on public.tryouts
for delete
to authenticated
using (
  (select public.current_profile_role()) = 'admin'::public.profile_role
  or (
    (select public.current_profile_role()) = 'mentor'::public.profile_role
    and created_by = (select auth.uid())
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
);

-- Question/option reads for managers; student data is exposed only by controlled RPCs.
drop policy if exists tryout_questions_manager_select on public.tryout_questions;
create policy tryout_questions_manager_select
on public.tryout_questions
for select
to authenticated
using (public.can_manage_tryout(tryout_id));

drop policy if exists tryout_options_manager_select on public.tryout_options;
create policy tryout_options_manager_select
on public.tryout_options
for select
to authenticated
using (
  exists (
    select 1
    from public.tryout_questions q
    where q.id = tryout_options.question_id
      and public.can_manage_tryout(q.tryout_id)
  )
);

-- Assigned-course inbox access for mentors, global access for Admin, own access for students.
drop policy if exists lesson_message_threads_select on public.lesson_message_threads;
create policy lesson_message_threads_select
on public.lesson_message_threads
for select
to authenticated
using (
  student_profile_id = (select auth.uid())
  or (select public.current_profile_role()) = 'admin'::public.profile_role
  or (
    (select public.current_profile_role()) = 'mentor'::public.profile_role
    and public.is_assigned_mentor((select auth.uid()), course_id)
  )
);

drop policy if exists lesson_message_entries_select on public.lesson_message_entries;
create policy lesson_message_entries_select
on public.lesson_message_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_entries.thread_id
      and (
        t.student_profile_id = (select auth.uid())
        or (select public.current_profile_role()) = 'admin'::public.profile_role
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

drop policy if exists lesson_message_entries_insert on public.lesson_message_entries;
create policy lesson_message_entries_insert
on public.lesson_message_entries
for insert
to authenticated
with check (
  sender_profile_id = (select auth.uid())
  and sender_role = (select public.current_profile_role())
  and sender_role in (
    'student'::public.profile_role,
    'mentor'::public.profile_role,
    'admin'::public.profile_role
  )
  and exists (
    select 1
    from public.lesson_message_threads t
    where t.id = lesson_message_entries.thread_id
      and (
        (
          sender_role = 'student'::public.profile_role
          and t.student_profile_id = (select auth.uid())
        )
        or sender_role = 'admin'::public.profile_role
        or (
          sender_role = 'mentor'::public.profile_role
          and t.status <> 'closed'
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  )
);

-- Preserve image support in the private course-materials bucket.
update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct mime order by mime)
  from unnest(
    coalesce(allowed_mime_types, array[]::text[])
    || array['image/jpeg','image/png','image/webp']::text[]
  ) as mime
)
where id = 'course-materials';

revoke all on function public.is_assigned_mentor(uuid, uuid) from public, anon;
revoke all on function public.can_manage_tryout(uuid) from public, anon;
revoke all on function public.get_message_participant_summaries(uuid[]) from public, anon;
grant execute on function public.is_assigned_mentor(uuid, uuid) to authenticated;
grant execute on function public.can_manage_tryout(uuid) to authenticated;
grant execute on function public.get_message_participant_summaries(uuid[]) to authenticated;
