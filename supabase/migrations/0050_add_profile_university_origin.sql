-- Menyimpan universitas asal peserta hanya untuk kebutuhan pendataan.
-- Kolom ini tidak digunakan sebagai relasi course atau pembatas akses.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS university_origin VARCHAR(150);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_profiles_university_origin_not_blank;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_university_origin_not_blank
  CHECK (
    university_origin IS NULL
    OR LENGTH(TRIM(university_origin)) > 0
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    university_origin,
    role,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      'Mahasiswa'
    ),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
      CONCAT('TEMP-', SUBSTRING(NEW.id::text, 1, 8))
    ),
    NULLIF(
      TRIM(NEW.raw_user_meta_data->>'university_origin'),
      ''
    ),
    'student',
    'active'
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

COMMIT;
