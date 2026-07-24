-- =========================================================
-- DOKTER AMBIS
-- Migration 0060
-- File    : 0060_course_materials_image_mime_types.sql
-- Purpose : Allow private quiz images in course-materials storage.
-- Depends : 0059_quiz_question_explanation_images.sql
-- =========================================================

UPDATE storage.buckets
SET allowed_mime_types = (
  SELECT ARRAY(
    SELECT DISTINCT mime_type
    FROM unnest(
      COALESCE(allowed_mime_types, ARRAY[]::TEXT[])
      || ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp'
      ]::TEXT[]
    ) AS mime_type
    ORDER BY mime_type
  )
)
WHERE id = 'course-materials';
