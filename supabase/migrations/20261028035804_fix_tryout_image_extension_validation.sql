-- Accept literal image extensions; preserve existing course/tryout/role checks.
CREATE OR REPLACE FUNCTION private.can_manage_tryout_image_object(object_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  target_course_id uuid;
  target_tryout_id uuid;
  folder_segment text;
  tryout_segment text;
  image_kind text;
  file_name text;
begin
  target_course_id := private.course_id_from_storage_path(object_name);
  folder_segment := split_part(object_name, '/', 2);
  tryout_segment := split_part(object_name, '/', 3);
  image_kind := split_part(object_name, '/', 4);
  file_name := split_part(object_name, '/', 5);

  if target_course_id is null
     or folder_segment not in ('quiz-images', 'tryout-images')
     or tryout_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or image_kind not in ('question', 'explanation')
     or file_name = ''
     or split_part(object_name, '/', 6) <> ''
     or position('..' in object_name) > 0
     or lower(file_name) !~ '[.](jpg|jpeg|png|webp)$' then
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
          private.is_active_leader()
          and private.leader_can_access_course(t.course_id)
        )
        or (
          (select public.current_profile_role()) = 'mentor'::public.profile_role
          and t.created_by = (select auth.uid())
          and public.is_assigned_mentor((select auth.uid()), t.course_id)
        )
      )
  );
end;
$function$
