-- =========================================================
-- DOKTER AMBIS
-- Migration 0019
-- Enrollments
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

    CONSTRAINT fk_enrollment_profile
        FOREIGN KEY(profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enrollment_course
        FOREIGN KEY(course_id)
        REFERENCES courses(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_price_snapshot
        CHECK(price_snapshot >= 0),

    CONSTRAINT uq_student_course
        UNIQUE(profile_id, course_id)
);

CREATE INDEX idx_enrollment_profile
ON enrollments(profile_id);

CREATE INDEX idx_enrollment_course
ON enrollments(course_id);

CREATE INDEX idx_enrollment_status
ON enrollments(status);