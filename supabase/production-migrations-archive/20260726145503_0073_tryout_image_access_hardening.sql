-- Archived from production migration history.
-- Production version: 20260726145503
-- Production name: 0073_tryout_image_access_hardening
-- Intentionally stored outside supabase/migrations so migration tooling does not replay it.

-- 0073: harden Try Out RPCs, exact A-D integrity, and Storage image ownership

-- A Storage object under quiz-images is manageable only by Admin or the Mentor who owns that Try Out.
create or replace function private.can_manage_tryout_image_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_course_id uuid;
  target_tryout_id uuid;
  tryout_segment text;
  image_kind text;
begin
  target_course_id := private.course_id_from_storage_path(object_name);

  if target_course_id is null
     or split_part(object_name, '/', 2) <> 'quiz-images' then
    return false;
  end if;

  tryout_segment := split_part(object_name, '/', 3);
  image_kind := split_part(object_name, '/', 4);

  if tryout_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or image_kind not in ('question', 'explanation')
     or split_part(object_name, '/', 5) = '' then
    return false;
  end if;

  target_tryout_id := tryout_segment::uuid;

  return exists (
    select 1
    from public.tryouts t
    where t.id = target_tryout_id
      and t.course_id = target_course_id
      and (
        private.is_active_admin()
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and t.created_by = (select auth.uid())
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  );
end;
$$;

revoke all on function private.can_manage_tryout_image_object(text) from public, anon, authenticated;

-- Existing course files retain course-manager access; quiz-images additionally require Try Out ownership.
drop policy if exists course_materials_manager_insert on storage.objects;
create policy course_materials_manager_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'course-materials'
  and case
    when split_part(name, '/', 2) = 'quiz-images'
      then private.can_manage_tryout_image_object(name)
    else private.can_manage_course(private.course_id_from_storage_path(name))
  end
);

drop policy if exists course_materials_manager_update on storage.objects;
create policy course_materials_manager_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'course-materials'
  and case
    when split_part(name, '/', 2) = 'quiz-images'
      then private.can_manage_tryout_image_object(name)
    else private.can_manage_course(private.course_id_from_storage_path(name))
  end
)
with check (
  bucket_id = 'course-materials'
  and case
    when split_part(name, '/', 2) = 'quiz-images'
      then private.can_manage_tryout_image_object(name)
    else private.can_manage_course(private.course_id_from_storage_path(name))
  end
);

drop policy if exists course_materials_manager_delete on storage.objects;
create policy course_materials_manager_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'course-materials'
  and case
    when split_part(name, '/', 2) = 'quiz-images'
      then private.can_manage_tryout_image_object(name)
    else private.can_manage_course(private.course_id_from_storage_path(name))
  end
);

-- Deferred integrity check: each persisted Try Out question must have A-D and exactly one key.
create or replace function private.enforce_tryout_question_four_options()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_question_id uuid;
  option_count integer;
  correct_count integer;
begin
  target_question_id := case
    when tg_table_name = 'tryout_questions' and tg_op = 'DELETE' then old.id
    when tg_table_name = 'tryout_questions' then new.id
    when tg_op = 'DELETE' then old.question_id
    else new.question_id
  end;

  if not exists (
    select 1 from public.tryout_questions q where q.id = target_question_id
  ) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  select count(*)::integer,
         count(*) filter (where o.is_correct)::integer
  into option_count, correct_count
  from public.tryout_options o
  where o.question_id = target_question_id;

  if option_count <> 4 or correct_count <> 1 then
    raise exception 'Setiap soal Try Out wajib memiliki tepat pilihan A-D dan satu jawaban benar.'
      using errcode = '23514';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.enforce_tryout_question_four_options() from public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_tryout_question_four_options_from_options ON public.tryout_options;
create constraint trigger trg_tryout_question_four_options_from_options
after insert or update or delete on public.tryout_options
deferrable initially deferred
for each row execute function private.enforce_tryout_question_four_options();

DROP TRIGGER IF EXISTS trg_tryout_question_four_options_from_question ON public.tryout_questions;
create constraint trigger trg_tryout_question_four_options_from_question
after insert or update on public.tryout_questions
deferrable initially deferred
for each row execute function private.enforce_tryout_question_four_options();

-- Use a fixed empty search path for security-definer Try Out and messaging functions.
do $$
declare
  fn record;
begin
  for fn in
    select n.nspname as schema_name,
           p.proname,
           pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.proname in (
        'current_profile_role',
        'is_assigned_mentor',
        'can_manage_tryout',
        'admin_create_tryout_question',
        'admin_update_tryout_question',
        'manage_delete_tryout_question',
        'get_managed_tryout_results',
        'get_message_participant_summaries',
        'start_tryout_attempt',
        'get_tryout_attempt',
        'save_tryout_answer',
        'submit_tryout_attempt',
        'finalize_tryout_attempt',
        'get_tryout_result',
        'get_tryout_review',
        'get_student_tryout_summaries',
        'guard_tryout_option_mutation',
        'guard_tryout_question_mutation',
        'guard_tryout_settings_mutation',
        'sync_lesson_message_thread_after_entry',
        'guard_tryout_question_image_paths',
        'can_manage_tryout_image_object',
        'enforce_tryout_question_four_options'
      )
      and p.prosecdef
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = ''''',
      fn.schema_name,
      fn.proname,
      fn.identity_args
    );
  end loop;
end;
$$;

-- Questions/options and attempt records are mutated only through controlled RPCs.
revoke insert, update, delete, truncate
on public.tryout_questions,
   public.tryout_options,
   public.tryout_attempts,
   public.tryout_answers,
   public.tryout_results
from authenticated, anon;

grant select
on public.tryout_questions,
   public.tryout_options,
   public.tryout_attempts,
   public.tryout_answers,
   public.tryout_results
to authenticated;

-- Remove default PUBLIC/anon execution and grant only the application RPC surface.
do $$
declare
  fn record;
begin
  for fn in
    select n.nspname as schema_name,
           p.proname,
           pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'current_profile_role',
        'is_assigned_mentor',
        'can_manage_tryout',
        'admin_create_tryout_question',
        'admin_update_tryout_question',
        'manage_delete_tryout_question',
        'get_managed_tryout_results',
        'get_message_participant_summaries',
        'start_tryout_attempt',
        'get_tryout_attempt',
        'save_tryout_answer',
        'submit_tryout_attempt',
        'get_tryout_result',
        'get_tryout_review',
        'get_student_tryout_summaries'
      )
  loop
    execute format(
      'revoke all on function %I.%I(%s) from public, anon',
      fn.schema_name,
      fn.proname,
      fn.identity_args
    );
    execute format(
      'grant execute on function %I.%I(%s) to authenticated',
      fn.schema_name,
      fn.proname,
      fn.identity_args
    );
  end loop;
end;
$$;
