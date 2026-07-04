-- =========================================================
-- DOKTER AMBIS
-- Migration 0010
-- File : 0010_lessons.sql
-- Purpose : Learning lessons
-- =========================================================

CREATE TABLE lessons (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL,

    slug VARCHAR(100) NOT NULL,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    lesson_order INTEGER NOT NULL,

    duration INTEGER NOT NULL,

    is_free BOOLEAN
        NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_lessons_slug
        UNIQUE(slug),

    CONSTRAINT uq_lessons_course_order
        UNIQUE(course_id, lesson_order),

    CONSTRAINT fk_lessons_course
        FOREIGN KEY(course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_lessons_slug
        CHECK(length(trim(slug)) > 0),

    CONSTRAINT chk_lessons_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT chk_lesson_order
        CHECK(lesson_order > 0),

    CONSTRAINT chk_lesson_duration
        CHECK(duration > 0)
);

CREATE INDEX idx_lessons_course
ON lessons(course_id);

CREATE INDEX idx_lessons_order
ON lessons(course_id, lesson_order);

CREATE INDEX idx_lessons_created_at
ON lessons(created_at);