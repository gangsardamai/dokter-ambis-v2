-- =========================================================
-- DOKTER AMBIS
-- Migration 0012
-- File : 0012_lesson_files.sql
-- Purpose : Lesson files (PDF, PPT, DOC, etc.)
-- =========================================================

CREATE TABLE lesson_files (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    lesson_id UUID NOT NULL,

    title VARCHAR(150) NOT NULL,

    file_type file_type NOT NULL,

    file_path TEXT NOT NULL,

    version INTEGER
        NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lesson_files_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_lesson_files_path
        UNIQUE(file_path),

    CONSTRAINT chk_lesson_files_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT chk_lesson_files_path
        CHECK(length(trim(file_path)) > 0),

    CONSTRAINT chk_lesson_files_version
        CHECK(version > 0)
);

CREATE INDEX idx_lesson_files_lesson
ON lesson_files(lesson_id);

CREATE INDEX idx_lesson_files_created_at
ON lesson_files(created_at);