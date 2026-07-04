-- =========================================================
-- DOKTER AMBIS
-- Migration 0003
-- File : 0003_functions.sql
-- Purpose : Shared database functions
-- =========================================================

-- =========================================================
-- Automatically update updated_at column
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;