-- =========================================================
-- DOKTER AMBIS
-- Announcement center with global, university, and course targeting
-- =========================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title varchar(200) NOT NULL,
  content text NOT NULL,
  all_students boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NULL,
  show_on_dashboard boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcements_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT announcements_content_not_blank CHECK (length(trim(content)) > 0),
  CONSTRAINT announcements_valid_period CHECK (ends_at IS NULL OR ends_at >= starts_at),
  CONSTRAINT announcements_display_order_positive CHECK (display_order >= 0)
);

CREATE TABLE IF NOT EXISTS public.announcement_organizations (
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, organization_id)
);

CREATE TABLE IF NOT EXISTS public.announcement_courses (
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, course_id)
);

CREATE INDEX IF NOT EXISTS announcements_dashboard_order_idx
  ON public.announcements(show_on_dashboard, display_order, starts_at);
CREATE INDEX IF NOT EXISTS announcements_published_start_idx
  ON public.announcements(is_published, starts_at);
CREATE INDEX IF NOT EXISTS announcement_organizations_organization_idx
  ON public.announcement_organizations(organization_id, announcement_id);
CREATE INDEX IF NOT EXISTS announcement_courses_course_idx
  ON public.announcement_courses(course_id, announcement_id);

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_courses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_courses TO authenticated;

DROP POLICY IF EXISTS announcements_admin_all ON public.announcements;
CREATE POLICY announcements_admin_all
ON public.announcements
FOR ALL
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

DROP POLICY IF EXISTS announcement_organizations_authenticated_read ON public.announcement_organizations;
CREATE POLICY announcement_organizations_authenticated_read
ON public.announcement_organizations
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS announcement_courses_authenticated_read ON public.announcement_courses;
CREATE POLICY announcement_courses_authenticated_read
ON public.announcement_courses
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS announcement_organizations_admin_write ON public.announcement_organizations;
CREATE POLICY announcement_organizations_admin_write
ON public.announcement_organizations
FOR ALL
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

DROP POLICY IF EXISTS announcement_courses_admin_write ON public.announcement_courses;
CREATE POLICY announcement_courses_admin_write
ON public.announcement_courses
FOR ALL
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

DROP POLICY IF EXISTS announcements_student_read ON public.announcements;
CREATE POLICY announcements_student_read
ON public.announcements
FOR SELECT
TO authenticated
USING (
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
);
