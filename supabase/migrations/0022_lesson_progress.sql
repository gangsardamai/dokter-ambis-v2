-- =========================================================
-- DOKTER AMBIS
-- Migration 0022
-- File : 0022_lesson_progress.sql
-- Purpose : Student lesson progress
-- =========================================================

CREATE TABLE lesson_progress (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL,

    lesson_id UUID NOT NULL,

    is_completed BOOLEAN
        NOT NULL DEFAULT FALSE,

    progress_percent NUMERIC(5,2)
        NOT NULL DEFAULT 0,

    last_position_seconds INTEGER
        NOT NULL DEFAULT 0,

    last_accessed_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lesson_progress_profile
        FOREIGN KEY(profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lesson_progress_lesson
        FOREIGN KEY(lesson_id)
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_lesson_progress
        UNIQUE(profile_id, lesson_id),

    CONSTRAINT chk_lesson_progress_percent
        CHECK(
            progress_percent >= 0
            AND progress_percent <= 100
        ),

    CONSTRAINT chk_lesson_progress_position
        CHECK(
            last_position_seconds >= 0
        ),

    CONSTRAINT chk_lesson_progress_completed
        CHECK(
            completed_at IS NULL
            OR completed_at >= created_at
        ),

    CONSTRAINT chk_lesson_progress_last_accessed
        CHECK(
            last_accessed_at >= created_at
        ),

    CONSTRAINT chk_lesson_progress_completed_percent
        CHECK(
            is_completed = FALSE
            OR progress_percent = 100
        )
);

CREATE INDEX idx_lesson_progress_profile
ON lesson_progress(profile_id);

CREATE INDEX idx_lesson_progress_lesson
ON lesson_progress(lesson_id);

CREATE INDEX idx_lesson_progress_profile_completed
ON lesson_progress(profile_id, is_completed);

CREATE INDEX idx_lesson_progress_created_at
ON lesson_progress(created_at);