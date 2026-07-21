-- =====================================================
-- DOKTER AMBIS
-- Migration 0046
-- File : 0046_folder_grants.sql
-- Purpose : Grant table privileges
-- =====================================================

GRANT SELECT ON public.lesson_folders TO anon;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON public.lesson_folders
TO authenticated;