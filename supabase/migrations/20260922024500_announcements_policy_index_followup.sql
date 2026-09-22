CREATE INDEX IF NOT EXISTS announcements_created_by_idx
  ON public.announcements(created_by);

DROP POLICY IF EXISTS announcements_admin_all ON public.announcements;
DROP POLICY IF EXISTS announcements_student_read ON public.announcements;
DROP POLICY IF EXISTS announcements_read ON public.announcements;
DROP POLICY IF EXISTS announcements_admin_insert ON public.announcements;
DROP POLICY IF EXISTS announcements_admin_update ON public.announcements;
DROP POLICY IF EXISTS announcements_admin_delete ON public.announcements;

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
      all_students = true
      OR EXISTS (
        SELECT 1
        FROM public.announcement_courses ac
        JOIN public.enrollments e ON e.course_id = ac.course_id
        WHERE ac.announcement_id = announcements.id
          AND e.profile_id = (SELECT auth.uid())
          AND e.status = 'active'
          AND (e.expired_at IS NULL OR e.expired_at > now())
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
      )
    )
  )
);

CREATE POLICY announcements_admin_insert
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);

CREATE POLICY announcements_admin_update
ON public.announcements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);

CREATE POLICY announcements_admin_delete
ON public.announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS announcement_organizations_admin_write ON public.announcement_organizations;
DROP POLICY IF EXISTS announcement_organizations_admin_insert ON public.announcement_organizations;
DROP POLICY IF EXISTS announcement_organizations_admin_update ON public.announcement_organizations;
DROP POLICY IF EXISTS announcement_organizations_admin_delete ON public.announcement_organizations;

CREATE POLICY announcement_organizations_admin_insert
ON public.announcement_organizations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);

CREATE POLICY announcement_organizations_admin_update
ON public.announcement_organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);

CREATE POLICY announcement_organizations_admin_delete
ON public.announcement_organizations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);

DROP POLICY IF EXISTS announcement_courses_admin_write ON public.announcement_courses;
DROP POLICY IF EXISTS announcement_courses_admin_insert ON public.announcement_courses;
DROP POLICY IF EXISTS announcement_courses_admin_update ON public.announcement_courses;
DROP POLICY IF EXISTS announcement_courses_admin_delete ON public.announcement_courses;

CREATE POLICY announcement_courses_admin_insert
ON public.announcement_courses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);

CREATE POLICY announcement_courses_admin_update
ON public.announcement_courses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);

CREATE POLICY announcement_courses_admin_delete
ON public.announcement_courses
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  )
);
