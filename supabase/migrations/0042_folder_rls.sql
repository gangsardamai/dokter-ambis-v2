-- =========================================================
-- DOKTER AMBIS
-- Migration 0042
-- File : 0042_folder_triggers.sql
-- Purpose : Register updated_at trigger for lesson_folders
-- =========================================================

CREATE TRIGGER trg_lesson_folders_updated_at
BEFORE UPDATE ON lesson_folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();