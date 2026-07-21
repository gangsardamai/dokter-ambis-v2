-- =====================================================
-- DOKTER AMBIS
-- Migration 0046
-- File : 0046_folder_grants.sql
-- Purpose : Grant privileges
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.lesson_folders
TO authenticated;