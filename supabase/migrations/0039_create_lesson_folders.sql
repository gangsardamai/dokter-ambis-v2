-- =====================================================
-- Migration: 0039_create_lesson_folders.sql
-- Description: Create lesson folders table
-- =====================================================

CREATE TABLE public.lesson_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL,

    parent_folder_id UUID NULL,

    slug VARCHAR(100) NOT NULL,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    folder_order INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lesson_folders_course
        FOREIGN KEY (course_id)
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lesson_folders_parent
        FOREIGN KEY (parent_folder_id)
        REFERENCES public.lesson_folders(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_lesson_folders_slug
        UNIQUE(course_id, slug),

    CONSTRAINT uq_lesson_folders_parent_order
        UNIQUE(parent_folder_id, folder_order),

    CONSTRAINT chk_lesson_folders_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT chk_lesson_folders_slug
        CHECK(slug ~ '^[a-z0-9-]+$'),

    CONSTRAINT chk_folder_order
        CHECK(folder_order > 0)
);