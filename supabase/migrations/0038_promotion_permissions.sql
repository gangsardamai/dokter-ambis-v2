-- =========================================================
-- DOKTER AMBIS
-- Migration 0038
-- Promotion Permissions
-- =========================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE promotions
TO authenticated;