-- =========================================================
-- DOKTER AMBIS
-- Migration 0058
-- File    : 0058_security_performance_followup.sql
-- Purpose : Follow up Supabase Security and Performance
--           Advisor findings without weakening RLS.
-- Depends : 0057_public_catalog_read_grants.sql
-- =========================================================

-- ---------------------------------------------------------
-- 1. Cover the creator foreign key used by announcements.
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_course_announcements_created_by
ON public.course_announcements (created_by);

-- ---------------------------------------------------------
-- 2. Protect sensitive profile fields.
--
-- Users may update their own general profile data, but only
-- an active admin or service-role request may change role or
-- account status. Primary identity and creation time remain
-- immutable for all application updates.
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION private.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile ID tidak dapat diubah.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Waktu pembuatan profile tidak dapat diubah.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT private.is_active_admin()
     AND COALESCE((SELECT auth.role()), '') <> 'service_role'
     AND (
       NEW.role IS DISTINCT FROM OLD.role
       OR NEW.status IS DISTINCT FROM OLD.status
     ) THEN
    RAISE EXCEPTION 'Role dan status akun hanya dapat diubah oleh admin aktif.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL
ON FUNCTION private.protect_profile_sensitive_fields()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_fields
ON public.profiles;

CREATE TRIGGER trg_protect_profile_sensitive_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION private.protect_profile_sensitive_fields();

-- Remove the redundant legacy SELECT policy. The existing
-- combined admin/self policy already covers authenticated
-- profile reads with init-plan-safe function calls.
DROP POLICY IF EXISTS profiles_select_self
ON public.profiles;

DROP POLICY IF EXISTS profiles_update_self
ON public.profiles;

DROP POLICY IF EXISTS profiles_update_authorized
ON public.profiles;

CREATE POLICY profiles_update_authorized
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT private.is_active_admin())
  OR id = (SELECT auth.uid())
)
WITH CHECK (
  (SELECT private.is_active_admin())
  OR id = (SELECT auth.uid())
);

-- ---------------------------------------------------------
-- 3. Replace legacy public-role policies with explicit,
--    init-plan-safe authenticated policies.
-- ---------------------------------------------------------

DROP POLICY IF EXISTS lesson_progress_owner
ON public.lesson_progress;

CREATE POLICY lesson_progress_owner
ON public.lesson_progress
FOR ALL
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
)
WITH CHECK (
  profile_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS activity_logs_owner
ON public.activity_logs;

CREATE POLICY activity_logs_owner
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
);

-- The legacy ALL policy overlaps the newer operation-specific
-- device policies. Removing it preserves the effective table
-- privileges while eliminating duplicate policy evaluation.
DROP POLICY IF EXISTS device_sessions_owner
ON public.device_sessions;

DROP POLICY IF EXISTS "Students register own devices"
ON public.device_sessions;

CREATE POLICY "Students register own devices"
ON public.device_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = (SELECT auth.uid())
  AND (SELECT private.is_active_student())
);

-- ---------------------------------------------------------
-- 4. Consolidate equivalent admin/student UPDATE policies.
--    Permissive policies are OR-combined by PostgreSQL; these
--    single policies retain the same USING/WITH CHECK logic.
-- ---------------------------------------------------------

DROP POLICY IF EXISTS "Active admins update enrollments"
ON public.enrollments;

DROP POLICY IF EXISTS enrollments_student_payment_update
ON public.enrollments;

DROP POLICY IF EXISTS enrollments_update_authorized
ON public.enrollments;

CREATE POLICY enrollments_update_authorized
ON public.enrollments
FOR UPDATE
TO authenticated
USING (
  (SELECT private.is_active_admin())
  OR (
    profile_id = (SELECT auth.uid())
    AND (SELECT private.is_active_student())
    AND status = ANY (
      ARRAY[
        'pending_payment'::public.enrollment_status,
        'pending_approval'::public.enrollment_status
      ]
    )
  )
)
WITH CHECK (
  (SELECT private.is_active_admin())
  OR (
    profile_id = (SELECT auth.uid())
    AND (SELECT private.is_active_student())
    AND status = 'pending_approval'::public.enrollment_status
    AND activated_at IS NULL
    AND expired_at IS NULL
  )
);

DROP POLICY IF EXISTS "Active admins update payments"
ON public.payments;

DROP POLICY IF EXISTS payments_student_proof_update
ON public.payments;

DROP POLICY IF EXISTS payments_update_authorized
ON public.payments;

CREATE POLICY payments_update_authorized
ON public.payments
FOR UPDATE
TO authenticated
USING (
  (SELECT private.is_active_admin())
  OR (
    (SELECT private.is_active_student())
    AND status = ANY (
      ARRAY[
        'pending'::public.payment_status,
        'rejected'::public.payment_status
      ]
    )
    AND EXISTS (
      SELECT 1
      FROM public.enrollments
      WHERE enrollments.id = payments.enrollment_id
        AND enrollments.profile_id = (SELECT auth.uid())
    )
  )
)
WITH CHECK (
  (SELECT private.is_active_admin())
  OR (
    (SELECT private.is_active_student())
    AND status = 'pending'::public.payment_status
    AND payment_method = 'bank_transfer'::public.payment_method
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
        AND enrollments.status = ANY (
          ARRAY[
            'pending_payment'::public.enrollment_status,
            'pending_approval'::public.enrollment_status
          ]
        )
        AND payments.amount = GREATEST(
          enrollments.price_snapshot - enrollments.discount_amount,
          0::numeric
        )
    )
  )
);

-- ---------------------------------------------------------
-- Intentional Advisor exceptions
-- ---------------------------------------------------------
-- The following public SECURITY DEFINER RPCs intentionally
-- remain executable by authenticated users because they are
-- the controlled API boundary for quiz attempts/reviews and
-- transactional mentor assignment:
--   public.get_quiz_for_attempt(uuid)
--   public.get_quiz_review(uuid)
--   public.submit_quiz_attempt(uuid, jsonb)
--   public.set_course_mentors(uuid, uuid[])
-- Each function has an empty search_path, denies anon EXECUTE,
-- and performs its own role/course/enrollment authorization.
--
-- Unused indexes are intentionally retained while production
-- traffic is still too low to provide meaningful usage data.
