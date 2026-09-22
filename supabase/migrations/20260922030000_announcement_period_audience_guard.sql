-- Keep expired announcements available only to students who were already
-- part of the relevant audience before the announcement period ended.
DROP POLICY IF EXISTS announcements_read ON public.announcements;

CREATE POLICY announcements_read
ON public.announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
  OR (
    is_published = true
    AND starts_at <= now()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'student'
        AND p.status = 'active'
    )
    AND (
      (
        all_students = true
        AND (
          announcements.ends_at IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.profiles audience_profile
            WHERE audience_profile.id = (SELECT auth.uid())
              AND audience_profile.created_at <= announcements.ends_at
          )
        )
      )
      OR EXISTS (
        SELECT 1
        FROM public.announcement_courses ac
        JOIN public.enrollments e ON e.course_id = ac.course_id
        WHERE ac.announcement_id = announcements.id
          AND e.profile_id = (SELECT auth.uid())
          AND e.status = 'active'
          AND (e.expired_at IS NULL OR e.expired_at > now())
          AND (
            announcements.ends_at IS NULL
            OR COALESCE(e.activated_at, e.created_at) <= announcements.ends_at
          )
      )
      OR EXISTS (
        SELECT 1
        FROM public.announcement_organizations ao
        JOIN public.courses c ON c.organization_id = ao.organization_id
        JOIN public.enrollments e ON e.course_id = c.id
        WHERE ao.announcement_id = announcements.id
          AND e.profile_id = (SELECT auth.uid())
          AND e.status = 'active'
          AND (e.expired_at IS NULL OR e.expired_at > now())
          AND (
            announcements.ends_at IS NULL
            OR COALESCE(e.activated_at, e.created_at) <= announcements.ends_at
          )
      )
    )
  )
);
