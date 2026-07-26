-- Archived from production migration history.
-- Production version: 20260726150247
-- Production name: 0073_tryout_image_trigger_scope_cleanup
-- Intentionally stored outside supabase/migrations so migration tooling does not replay it.

-- 0073 companion: align the effective legacy image trigger and Storage policies with quiz-images/R2 paths

create or replace function public.guard_tryout_image_path_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
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
    raise exception 'Course Try Out tidak ditemukan.' using errcode = '23503';
  end if;

  new.image_path := nullif(btrim(new.image_path), '');
  new.explanation_image_path := nullif(btrim(new.explanation_image_path), '');

  plain_question_pattern :=
    '^' || target_course_id::text || '/(quiz-images|tryout-images)/' ||
    new.tryout_id::text || '/question/[^/]+$';
  r2_question_pattern :=
    '^r2://[^/]+/courses/' || target_course_id::text ||
    '/(quiz-images|tryout-images)/' || new.tryout_id::text ||
    '/question/[^/]+$';
  plain_explanation_pattern :=
    '^' || target_course_id::text || '/(quiz-images|tryout-images)/' ||
    new.tryout_id::text || '/explanation/[^/]+$';
  r2_explanation_pattern :=
    '^r2://[^/]+/courses/' || target_course_id::text ||
    '/(quiz-images|tryout-images)/' || new.tryout_id::text ||
    '/explanation/[^/]+$';

  if new.image_path is not null
     and (
       position('..' in new.image_path) > 0
       or (
         new.image_path !~ plain_question_pattern
         and new.image_path !~ r2_question_pattern
       )
       or lower(new.image_path) !~ E'\\.(jpg|jpeg|png|webp)$'
     ) then
    raise exception 'Path gambar soal tidak sesuai Course, Try Out, atau format gambar.'
      using errcode = '22023';
  end if;

  if new.explanation_image_path is not null
     and (
       position('..' in new.explanation_image_path) > 0
       or (
         new.explanation_image_path !~ plain_explanation_pattern
         and new.explanation_image_path !~ r2_explanation_pattern
       )
       or lower(new.explanation_image_path) !~ E'\\.(jpg|jpeg|png|webp)$'
     ) then
    raise exception 'Path gambar pembahasan tidak sesuai Course, Try Out, atau format gambar.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_tryout_image_path_scope() from public, anon, authenticated;

drop function if exists private.guard_tryout_question_image_paths();

-- Both current and legacy image folders require Try Out ownership, not only course assignment.
drop policy if exists course_materials_manager_insert on storage.objects;
create policy course_materials_manager_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'course-materials'
  and case
    when split_part(name, '/', 2) in ('quiz-images', 'tryout-images')
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
    when split_part(name, '/', 2) in ('quiz-images', 'tryout-images')
      then private.can_manage_tryout_image_object(name)
    else private.can_manage_course(private.course_id_from_storage_path(name))
  end
)
with check (
  bucket_id = 'course-materials'
  and case
    when split_part(name, '/', 2) in ('quiz-images', 'tryout-images')
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
    when split_part(name, '/', 2) in ('quiz-images', 'tryout-images')
      then private.can_manage_tryout_image_object(name)
    else private.can_manage_course(private.course_id_from_storage_path(name))
  end
);
