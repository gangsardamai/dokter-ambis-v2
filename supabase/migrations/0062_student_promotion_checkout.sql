-- =========================================================
-- DOKTER AMBIS
-- Migration 0062
-- File    : 0062_student_promotion_checkout.sql
-- Purpose : Allow students to apply promotion codes securely
--           and submit Rp0 enrollments for admin review.
-- Depends : 0061_programs_authenticated_select_policy.sql
-- =========================================================

CREATE OR REPLACE FUNCTION public.apply_promotion_code(
  target_enrollment_id UUID,
  submitted_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_profile_id UUID := (SELECT auth.uid());
  normalized_code TEXT := UPPER(BTRIM(COALESCE(submitted_code, '')));
  enrollment_record public.enrollments%ROWTYPE;
  promotion_record public.promotions%ROWTYPE;
  active_usage_count INTEGER := 0;
  profile_usage_count INTEGER := 0;
  calculated_discount NUMERIC := 0;
  final_amount NUMERIC := 0;
BEGIN
  IF current_profile_id IS NULL THEN
    RAISE EXCEPTION 'Silakan masuk terlebih dahulu.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT private.is_active_student() THEN
    RAISE EXCEPTION 'Hanya peserta aktif yang dapat memakai kode promosi.'
      USING ERRCODE = '42501';
  END IF;

  IF normalized_code = '' THEN
    RAISE EXCEPTION 'Kode promosi wajib diisi.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO enrollment_record
  FROM public.enrollments
  WHERE id = target_enrollment_id
    AND profile_id = current_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  IF enrollment_record.status <> 'pending_payment'::public.enrollment_status THEN
    RAISE EXCEPTION 'Kode promosi hanya dapat digunakan sebelum bukti pembayaran dikirim.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO promotion_record
  FROM public.promotions
  WHERE code IS NOT NULL
    AND UPPER(BTRIM(code)) = normalized_code
  ORDER BY priority ASC, created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kode promosi tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  IF promotion_record.status <> 'active'::public.promotion_status THEN
    RAISE EXCEPTION 'Kode promosi sedang tidak aktif.'
      USING ERRCODE = '22023';
  END IF;

  IF promotion_record.start_at > NOW() THEN
    RAISE EXCEPTION 'Kode promosi belum dapat digunakan.'
      USING ERRCODE = '22023';
  END IF;

  IF promotion_record.end_at IS NOT NULL
     AND promotion_record.end_at < NOW() THEN
    RAISE EXCEPTION 'Kode promosi sudah berakhir.'
      USING ERRCODE = '22023';
  END IF;

  IF promotion_record.course_id IS NOT NULL
     AND promotion_record.course_id <> enrollment_record.course_id THEN
    RAISE EXCEPTION 'Kode promosi tidak berlaku untuk course ini.'
      USING ERRCODE = '22023';
  END IF;

  IF enrollment_record.price_snapshot < COALESCE(promotion_record.minimum_purchase, 0) THEN
    RAISE EXCEPTION 'Harga course belum memenuhi minimum transaksi promosi.'
      USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO active_usage_count
  FROM public.enrollments
  WHERE promotion_id = promotion_record.id
    AND id <> enrollment_record.id
    AND status NOT IN (
      'cancelled'::public.enrollment_status,
      'expired'::public.enrollment_status
    );

  IF promotion_record.quota IS NOT NULL
     AND GREATEST(promotion_record.used_count, active_usage_count) >= promotion_record.quota THEN
    RAISE EXCEPTION 'Kuota kode promosi sudah habis.'
      USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO profile_usage_count
  FROM public.enrollments
  WHERE promotion_id = promotion_record.id
    AND profile_id = current_profile_id
    AND id <> enrollment_record.id
    AND status NOT IN (
      'cancelled'::public.enrollment_status,
      'expired'::public.enrollment_status
    );

  IF profile_usage_count >= promotion_record.usage_per_user THEN
    RAISE EXCEPTION 'Batas penggunaan kode promosi untuk akun ini sudah tercapai.'
      USING ERRCODE = '22023';
  END IF;

  calculated_discount := CASE promotion_record.type
    WHEN 'percentage'::public.promotion_type THEN
      ROUND(enrollment_record.price_snapshot * promotion_record.value / 100, 2)
    WHEN 'fixed_amount'::public.promotion_type THEN
      promotion_record.value
    WHEN 'special_price'::public.promotion_type THEN
      GREATEST(
        enrollment_record.price_snapshot
          - COALESCE(promotion_record.special_price, promotion_record.value),
        0
      )
    WHEN 'free'::public.promotion_type THEN
      enrollment_record.price_snapshot
    ELSE 0
  END;

  IF promotion_record.max_discount IS NOT NULL THEN
    calculated_discount := LEAST(
      calculated_discount,
      promotion_record.max_discount
    );
  END IF;

  calculated_discount := LEAST(
    GREATEST(calculated_discount, 0),
    enrollment_record.price_snapshot
  );

  final_amount := GREATEST(
    enrollment_record.price_snapshot - calculated_discount,
    0
  );

  UPDATE public.enrollments
  SET promotion_id = promotion_record.id,
      promotion_code_snapshot = promotion_record.code,
      promotion_name_snapshot = promotion_record.name,
      discount_amount = calculated_discount,
      updated_at = NOW()
  WHERE id = enrollment_record.id;

  RETURN jsonb_build_object(
    'promotion_id', promotion_record.id,
    'promotion_code', promotion_record.code,
    'promotion_name', promotion_record.name,
    'discount_amount', calculated_discount,
    'final_amount', final_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_zero_payment_enrollment(
  target_enrollment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_profile_id UUID := (SELECT auth.uid());
  enrollment_record public.enrollments%ROWTYPE;
  payment_record public.payments%ROWTYPE;
  final_amount NUMERIC := 0;
BEGIN
  IF current_profile_id IS NULL THEN
    RAISE EXCEPTION 'Silakan masuk terlebih dahulu.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT private.is_active_student() THEN
    RAISE EXCEPTION 'Hanya peserta aktif yang dapat mengirim pendaftaran.'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO enrollment_record
  FROM public.enrollments
  WHERE id = target_enrollment_id
    AND profile_id = current_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  IF enrollment_record.status <> 'pending_payment'::public.enrollment_status THEN
    RAISE EXCEPTION 'Enrollment ini sudah dikirim atau tidak dapat diproses.'
      USING ERRCODE = '22023';
  END IF;

  final_amount := GREATEST(
    enrollment_record.price_snapshot - enrollment_record.discount_amount,
    0
  );

  IF final_amount <> 0 THEN
    RAISE EXCEPTION 'Enrollment ini masih memiliki nominal pembayaran.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO payment_record
  FROM public.payments
  WHERE enrollment_id = enrollment_record.id
  FOR UPDATE;

  IF FOUND THEN
    IF payment_record.status = 'approved'::public.payment_status THEN
      RAISE EXCEPTION 'Pembayaran sudah disetujui.'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.payments
    SET amount = 0,
        payment_method = 'free'::public.payment_method,
        payment_proof_path = NULL,
        status = 'pending'::public.payment_status,
        paid_at = NOW(),
        verified_at = NULL,
        verified_by = NULL,
        notes = NULL,
        updated_at = NOW()
    WHERE id = payment_record.id;
  ELSE
    INSERT INTO public.payments (
      enrollment_id,
      amount,
      payment_method,
      payment_proof_path,
      status,
      paid_at
    ) VALUES (
      enrollment_record.id,
      0,
      'free'::public.payment_method,
      NULL,
      'pending'::public.payment_status,
      NOW()
    );
  END IF;

  UPDATE public.enrollments
  SET status = 'pending_approval'::public.enrollment_status,
      activated_at = NULL,
      updated_at = NOW()
  WHERE id = enrollment_record.id;

  RETURN jsonb_build_object(
    'enrollment_id', enrollment_record.id,
    'status', 'pending_approval',
    'amount', 0
  );
END;
$$;

REVOKE ALL
ON FUNCTION public.apply_promotion_code(UUID, TEXT)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.apply_promotion_code(UUID, TEXT)
TO authenticated;

REVOKE ALL
ON FUNCTION public.submit_zero_payment_enrollment(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.submit_zero_payment_enrollment(UUID)
TO authenticated;
