-- =========================================================
-- DOKTER AMBIS
-- Migration 0019
-- File : 0019_enrollments.sql
-- Purpose : Student course enrollments
-- =========================================================

CREATE TABLE enrollments (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL,

    course_id UUID NOT NULL,

    category enrollment_category
        NOT NULL DEFAULT 'regular',

    status enrollment_status
        NOT NULL DEFAULT 'pending_payment',

    price_snapshot NUMERIC(12,2)
        NOT NULL,

    enrolled_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    activated_at TIMESTAMPTZ,

    expired_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_enrollments_profile
        FOREIGN KEY(profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enrollments_course
        FOREIGN KEY(course_id)
        REFERENCES courses(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_enrollments_profile_course
        UNIQUE(profile_id, course_id),

    CONSTRAINT chk_enrollments_price_snapshot
        CHECK(price_snapshot >= 0),

    CONSTRAINT chk_enrollments_activated
        CHECK(
            activated_at IS NULL
            OR activated_at >= enrolled_at
        ),

    CONSTRAINT chk_enrollments_expired
        CHECK(
            expired_at IS NULL
            OR activated_at IS NULL
            OR expired_at >= activated_at
        )
);

CREATE INDEX idx_enrollments_profile
ON enrollments(profile_id);

CREATE INDEX idx_enrollments_course
ON enrollments(course_id);

CREATE INDEX idx_enrollments_status
ON enrollments(status);

CREATE INDEX idx_enrollments_profile_status
ON enrollments(profile_id, status);

CREATE INDEX idx_enrollments_created_at
ON enrollments(created_at);