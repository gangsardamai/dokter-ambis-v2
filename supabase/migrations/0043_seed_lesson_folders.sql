-- =========================================================
-- DOKTER AMBIS
-- Migration 0043
-- File : 0043_folder_rls.sql
-- Purpose : Enable Row Level Security & Policies
-- =========================================================

-- =========================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE lesson_folders
ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PUBLIC READ
-- =========================================================

CREATE POLICY lesson_folders_public_read
ON lesson_folders
FOR SELECT
USING (true);

-- =========================================================
-- AUTHENTICATED CRUD
-- (Temporary - will be tightened in Admin RLS migration)
-- =========================================================

CREATE POLICY lesson_folders_authenticated_all
ON lesson_folders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);