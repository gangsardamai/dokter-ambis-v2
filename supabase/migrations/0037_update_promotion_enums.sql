-- =========================================================
-- DOKTER AMBIS
-- Migration 0037
-- File : 0037_update_promotion_enums.sql
-- Purpose : Update Promotion Enum
-- =========================================================

-- =========================================================
-- RENAME ENUM VALUES
-- =========================================================

ALTER TYPE promotion_type
RENAME VALUE 'fixed_discount'
TO 'fixed_amount';

ALTER TYPE promotion_type
RENAME VALUE 'fixed_price'
TO 'special_price';

-- =========================================================
-- REMOVE UNUSED ENUM
-- =========================================================
--
-- Enum PostgreSQL tidak dapat menghapus value secara langsung.
-- Value 'free' tetap dipertahankan untuk kompatibilitas.
-- Aplikasi tidak lagi menggunakannya.
--