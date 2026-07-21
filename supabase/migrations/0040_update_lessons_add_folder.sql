-- =====================================================
-- DOKTER AMBIS
-- Migration 0040
-- File : 0040_update_lessons_add_folder.sql
-- Purpose : Add folder support to lessons
-- =====================================================

ALTER TABLE lessons
ADD COLUMN folder_id UUID NULL;

ALTER TABLE lessons
ADD CONSTRAINT fk_lessons_folder
FOREIGN KEY (folder_id)
REFERENCES lesson_folders(id)
ON DELETE SET NULL;

CREATE INDEX idx_lessons_folder
ON lessons(folder_id);

CREATE INDEX idx_lessons_folder_order
ON lessons(folder_id, lesson_order);