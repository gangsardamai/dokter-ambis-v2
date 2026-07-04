-- =========================================================
-- DOKTER AMBIS
-- Migration 0008
-- File : 0008_mentor_details.sql
-- Purpose : Mentor additional information
-- =========================================================

CREATE TABLE mentor_details (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL,

    bio TEXT,

    specialization VARCHAR(150),

    education TEXT,

    photo_path TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_mentor_profile
        FOREIGN KEY(profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_mentor_profile
        UNIQUE(profile_id),

    CONSTRAINT chk_mentor_specialization
        CHECK (
            specialization IS NULL
            OR length(trim(specialization)) > 0
        )
);

CREATE INDEX idx_mentor_profile
ON mentor_details(profile_id);

CREATE INDEX idx_mentor_created_at
ON mentor_details(created_at);