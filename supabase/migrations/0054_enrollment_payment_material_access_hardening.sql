-- =========================================================
-- DOKTER AMBIS
-- Migration 0054
-- File    : 0054_enrollment_payment_material_access_hardening.sql
-- Purpose : Prevent student privilege escalation in enrollment/payment
--           flows and restrict paid learning content to active access.
-- Depends : 0053_supabase_security_hardening.sql
-- =========================================================

-- =========================================================
-- AUTHORIZATION HELPERS
-- =========================================================

CREATE OR REPLACE FUNCTION private.is_active_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'student'
      AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION private.is_active_student() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_active_student() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_active_student() TO authenticated;

-- Tighten the helper from migration 0053 so suspended/inactive students
-- immediately lose course access even while an older JWT is still valid.
CREATE OR REPLACE FUNCTION private.has_active_course_access(
  target_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    private.is_active_student()
    AND EXISTS (
      SELECT 1
      FROM public.enrollments
      WHERE profile_id = (SELECT auth.uid())
        AND course_id = target_course_id
        AND status = 'active'
        AND (
          expired_at IS NULL
          OR expired_at > NOW()
        )
    );
$$;

REVOKE ALL ON FUNCTION private.has_active_course_access(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_active_course_access(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION private.has_active_course_access(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION private.can_access_lesson(
  target_lesson_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    private.is_active_admin()
    OR EXISTS (
      SELECT 1
      FROM public.lessons
      WHERE id = target_lesson_id
        AND private.has_active_course_access(course_id)
    );
$$;

REVOKE ALL ON FUNCTION private.can_access_lesson(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_access_lesson(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION private.can_access_lesson(UUID) TO authenticated;

-- =========================================================
-- ENROLLMENT WRITE GUARD
-- =========================================================

CREATE OR REPLACE FUNCTION private.guard_student_enrollment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF private.is_active_admin() THEN
    RETURN NEW;
  END IF;

  IF (SELECT auth.uid()) IS NULL
     OR OLD.profile_id <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Enrollment hanya dapat diubah oleh pemilik atau admin.'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.status NOT IN ('pending_payment', 'pending_approval')
     OR NEW.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Perubahan status enrollment tidak diizinkan.'
      USING ERRCODE = '42501';
  END IF;

  IF ROW(
    NEW.id,
    NEW.profile_id,
    NEW.course_id,
    NEW.category,
    NEW.price_snapshot,
    NEW.enrolled_at,
    NEW.activated_at,
    NEW.expired_at,
    NEW.created_at,
    NEW.promotion_id,
    NEW.promotion_code_snapshot,
    NEW.promotion_name_snapshot,
    NEW.discount_amount
  ) IS DISTINCT FROM ROW(
    OLD.id,
    OLD.profile_id,
    OLD.course_id,
    OLD.category,
    OLD.price_snapshot,
    OLD.enrolled_at,
    OLD.activated_at,
    OLD.expired_at,
    OLD.created_at,
    OLD.promotion_id,
    OLD.promotion_code_snapshot,
    OLD.promotion_name_snapshot,
    OLD.discount_amount
  ) THEN
    RAISE EXCEPTION 'Kolom enrollment yang dilindungi tidak boleh diubah peserta.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_student_enrollment_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_student_enrollment_update() FROM anon;
REVOKE ALL ON FUNCTION private.guard_student_enrollment_update() FROM authenticated;

DROP TRIGGER IF EXISTS trg_guard_student_enrollment_update
ON public.enrollments;

CREATE TRIGGER trg_guard_student_enrollment_update
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION private.guard_student_enrollment_update();

DROP POLICY IF EXISTS enrollments_owner
ON public.enrollments;
DROP POLICY IF EXISTS enrollments_student_insert
ON public.enrollments;
DROP POLICY IF EXISTS enrollments_student_payment_update
ON public.enrollments;
DROP POLICY IF EXISTS enrollments_admin_delete
ON public.enrollments;

CREATE POLICY enrollments_student_insert
ON public.enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = (SELECT auth.uid())
  AND (SELECT private.is_active_student())
  AND category = 'regular'
  AND status = 'pending_payment'
  AND discount_amount = 0
  AND promotion_id IS NULL
  AND promotion_code_snapshot IS NULL
  AND promotion_name_snapshot IS NULL
  AND activated_at IS NULL
  AND expired_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.courses
    WHERE courses.id = enrollments.course_id
      AND courses.status = 'active'
      AND enrollments.price_snapshot = CASE
        WHEN courses.is_free THEN 0
        ELSE courses.price
      END
  )
);

CREATE POLICY enrollments_student_payment_update
ON public.enrollments
FOR UPDATE
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  AND (SELECT private.is_active_student())
  AND status IN ('pending_payment', 'pending_approval')
)
WITH CHECK (
  profile_id = (SELECT auth.uid())
  AND (SELECT private.is_active_student())
  AND status = 'pending_approval'
  AND activated_at IS NULL
  AND expired_at IS NULL
);

CREATE POLICY enrollments_admin_delete
ON public.enrollments
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

-- =========================================================
-- PAYMENT WRITE GUARD
-- =========================================================

CREATE OR REPLACE FUNCTION private.guard_student_payment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF private.is_active_admin() THEN
    RETURN NEW;
  END IF;

  IF (SELECT auth.uid()) IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM public.enrollments
       WHERE enrollments.id = OLD.enrollment_id
         AND enrollments.profile_id = (SELECT auth.uid())
     ) THEN
    RAISE EXCEPTION 'Pembayaran hanya dapat diubah oleh pemilik atau admin.'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.status NOT IN ('pending', 'rejected')
     OR NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'Perubahan status pembayaran tidak diizinkan.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.enrollment_id IS DISTINCT FROM OLD.enrollment_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Identitas pembayaran tidak boleh diubah peserta.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_student_payment_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_student_payment_update() FROM anon;
REVOKE ALL ON FUNCTION private.guard_student_payment_update() FROM authenticated;

DROP TRIGGER IF EXISTS trg_guard_student_payment_update
ON public.payments;

CREATE TRIGGER trg_guard_student_payment_update
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION private.guard_student_payment_update();

DROP POLICY IF EXISTS payments_owner
ON public.payments;
DROP POLICY IF EXISTS payments_student_insert
ON public.payments;
DROP POLICY IF EXISTS payments_student_proof_update
ON public.payments;
DROP POLICY IF EXISTS payments_admin_delete
ON public.payments;

CREATE POLICY payments_student_insert
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT private.is_active_student())
  AND status = 'pending'
  AND payment_method = 'bank_transfer'
  AND payment_proof_path IS NOT NULL
  AND paid_at IS NOT NULL
  AND verified_at IS NULL
  AND verified_by IS NULL
  AND notes IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE enrollments.id = payments.enrollment_id
      AND enrollments.profile_id = (SELECT auth.uid())
      AND enrollments.status IN ('pending_payment', 'pending_approval')
      AND payments.amount = GREATEST(
        enrollments.price_snapshot - enrollments.discount_amount,
        0
      )
  )
);

CREATE POLICY payments_student_proof_update
ON public.payments
FOR UPDATE
TO authenticated
USING (
  (SELECT private.is_active_student())
  AND status IN ('pending', 'rejected')
  AND EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE enrollments.id = payments.enrollment_id
      AND enrollments.profile_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (SELECT private.is_active_student())
  AND status = 'pending'
  AND payment_method = 'bank_transfer'
  AND payment_proof_path IS NOT NULL
  AND paid_at IS NOT NULL
  AND verified_at IS NULL
  AND verified_by IS NULL
  AND notes IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE enrollments.id = payments.enrollment_id
      AND enrollments.profile_id = (SELECT auth.uid())
      AND enrollments.status IN ('pending_payment', 'pending_approval')
      AND payments.amount = GREATEST(
        enrollments.price_snapshot - enrollments.discount_amount,
        0
      )
  )
);

CREATE POLICY payments_admin_delete
ON public.payments
FOR DELETE
TO authenticated
USING ((SELECT private.is_active_admin()));

-- =========================================================
-- LEARNING CONTENT ACCESS
-- No preview: only active admins or students with active,
-- unexpired enrollment may read folders and lesson content.
-- =========================================================

DROP POLICY IF EXISTS "Authenticated users can view lessons"
ON public.lessons;
DROP POLICY IF EXISTS lessons_public_read
ON public.lessons;

-- The authorized policy created in migration 0053 remains the only
-- authenticated lesson read path.

DROP POLICY IF EXISTS lesson_folders_public_read
ON public.lesson_folders;
DROP POLICY IF EXISTS lesson_folders_select
ON public.lesson_folders;

DROP POLICY IF EXISTS videos_public_read
ON public.videos;
DROP POLICY IF EXISTS videos_student_access
ON public.videos;

CREATE POLICY videos_student_access
ON public.videos
FOR SELECT
TO authenticated
USING (private.can_access_lesson(lesson_id));

DROP POLICY IF EXISTS lesson_files_public_read
ON public.lesson_files;
DROP POLICY IF EXISTS lesson_files_authorized_read
ON public.lesson_files;

CREATE POLICY lesson_files_authorized_read
ON public.lesson_files
FOR SELECT
TO authenticated
USING (private.can_access_lesson(lesson_id));

DROP POLICY IF EXISTS live_classes_public_read
ON public.live_classes;
DROP POLICY IF EXISTS live_classes_authorized_read
ON public.live_classes;

CREATE POLICY live_classes_authorized_read
ON public.live_classes
FOR SELECT
TO authenticated
USING (private.can_access_lesson(lesson_id));

DROP POLICY IF EXISTS quizzes_public_read
ON public.quizzes;
DROP POLICY IF EXISTS quizzes_authorized_read
ON public.quizzes;

CREATE POLICY quizzes_authorized_read
ON public.quizzes
FOR SELECT
TO authenticated
USING (private.can_access_lesson(lesson_id));

DROP POLICY IF EXISTS quiz_questions_public_read
ON public.quiz_questions;
DROP POLICY IF EXISTS quiz_questions_authorized_read
ON public.quiz_questions;

CREATE POLICY quiz_questions_authorized_read
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
      AND private.can_access_lesson(quizzes.lesson_id)
  )
);

DROP POLICY IF EXISTS quiz_options_public_read
ON public.quiz_options;
DROP POLICY IF EXISTS quiz_options_authorized_read
ON public.quiz_options;

CREATE POLICY quiz_options_authorized_read
ON public.quiz_options
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quiz_questions
    JOIN public.quizzes
      ON quizzes.id = quiz_questions.quiz_id
    WHERE quiz_questions.id = quiz_options.question_id
      AND private.can_access_lesson(quizzes.lesson_id)
  )
);
