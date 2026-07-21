-- =====================================================
-- DOKTER AMBIS
-- Migration 0041
-- File : 0041_folder_indexes.sql
-- Purpose : Performance indexes
-- =====================================================

CREATE INDEX idx_lesson_folders_course
ON lesson_folders(course_id);

CREATE INDEX idx_lesson_folders_parent
ON lesson_folders(parent_folder_id);

CREATE INDEX idx_lesson_folders_course_parent
ON lesson_folders(course_id, parent_folder_id);

CREATE INDEX idx_lesson_folders_order
ON lesson_folders(course_id, folder_order);

CREATE INDEX idx_lesson_folders_created_at
ON lesson_folders(created_at);