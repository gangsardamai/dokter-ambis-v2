-- =========================================================
-- DOKTER AMBIS
-- Migration 0023
-- File : 0023_course_announcements.sql
-- Purpose : Course announcements
-- =========================================================

CREATE TABLE course_announcements (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL,

    created_by UUID NOT NULL,

    title VARCHAR(200) NOT NULL,

    content TEXT NOT NULL,

    is_published BOOLEAN
        NOT NULL DEFAULT TRUE,

    published_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_course_announcements_course
        FOREIGN KEY(course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_course_announcements_creator
        FOREIGN KEY(created_by)
        REFERENCES profiles(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_course_announcements_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT chk_course_announcements_content
        CHECK(length(trim(content)) > 0),

    CONSTRAINT chk_course_announcements_published
        CHECK(
            published_at >= created_at
        )
);

CREATE INDEX idx_course_announcements_course
ON course_announcements(course_id);

CREATE INDEX idx_course_announcements_published
ON course_announcements(is_published);

CREATE INDEX idx_course_announcements_course_published
ON course_announcements(course_id, is_published);

CREATE INDEX idx_course_announcements_created_at
ON course_announcements(created_at);