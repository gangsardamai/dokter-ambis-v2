-- =========================================================
-- DOKTER AMBIS
-- Migration 0011
-- File : 0011_videos.sql
-- Purpose : Lesson videos
-- =========================================================

CREATE TABLE videos (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    lesson_id UUID NOT NULL,

    title VARCHAR(150) NOT NULL,

    provider video_provider
        NOT NULL,

    provider_video_id VARCHAR(255)
        NOT NULL,

    duration INTEGER NOT NULL,

    version INTEGER
        NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_videos_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_videos_provider_video
        UNIQUE(provider, provider_video_id),

    CONSTRAINT chk_videos_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT chk_videos_duration
        CHECK(duration > 0),

    CONSTRAINT chk_videos_version
        CHECK(version > 0)
);

CREATE INDEX idx_videos_lesson
ON videos(lesson_id);

CREATE INDEX idx_videos_created_at
ON videos(created_at);