-- =========================================================
-- DOKTER AMBIS
-- Migration : 0029
-- File      : 0029_add_phone_to_profiles.sql
-- Purpose   : Add phone column to profiles
-- =========================================================

-- =========================================================
-- 1. Add phone column
-- =========================================================

ALTER TABLE profiles
ADD COLUMN phone VARCHAR(20);

-- =========================================================
-- 2. Populate existing rows
-- (safe if database already contains data)
-- =========================================================

UPDATE profiles
SET phone = CONCAT(
    'TEMP-',
    SUBSTRING(id::text, 1, 8)
)
WHERE phone IS NULL;

-- =========================================================
-- 3. Make phone required
-- =========================================================

ALTER TABLE profiles
ALTER COLUMN phone
SET NOT NULL;

-- =========================================================
-- 4. Unique phone number
-- =========================================================

ALTER TABLE profiles
ADD CONSTRAINT uq_profiles_phone
UNIQUE (phone);

-- =========================================================
-- 5. Basic validation
-- =========================================================

ALTER TABLE profiles
ADD CONSTRAINT chk_profiles_phone_length
CHECK (
    length(trim(phone)) >= 10
);