-- Mengizinkan penggunaan nomor WhatsApp tanpa validasi format
-- dan memperbolehkan satu nomor digunakan oleh lebih dari satu akun.

BEGIN;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS uq_profiles_phone;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS chk_profiles_phone_length;

COMMIT;