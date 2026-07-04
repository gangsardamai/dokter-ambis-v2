-- =========================================================
-- DOKTER AMBIS
-- Migration 0013
-- File : 0013_live_classes.sql
-- Purpose : Live classes
-- =========================================================

CREATE TABLE live_classes (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    lesson_id UUID NOT NULL,

    title VARCHAR(150) NOT NULL,

    meeting_date TIMESTAMPTZ NOT NULL,

    meeting_link TEXT,

    recording_path TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_live_classes_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_live_classes_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT chk_live_classes_meeting_link
        CHECK(
            meeting_link IS NULL
            OR length(trim(meeting_link)) > 0
        ),

    CONSTRAINT chk_live_classes_recording_path
        CHECK(
            recording_path IS NULL
            OR length(trim(recording_path)) > 0
        )
);

CREATE INDEX idx_live_classes_lesson
ON live_classes(lesson_id);

CREATE INDEX idx_live_classes_meeting_date
ON live_classes(meeting_date);

CREATE INDEX idx_live_classes_created_at
ON live_classes(created_at);