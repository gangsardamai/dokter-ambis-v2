-- =====================================================
-- DOKTER AMBIS
-- Migration 0045
-- File : 0045_seed_lesson_folders.sql
-- Purpose : Default folders
-- =====================================================

INSERT INTO lesson_folders
(
    course_id,
    slug,
    title,
    description,
    folder_order
)
SELECT
    id,
    'materi-utama',
    'Materi Utama',
    'Folder default',
    1
FROM courses;