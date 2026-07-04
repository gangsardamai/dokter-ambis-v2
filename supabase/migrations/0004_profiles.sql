-- =========================================================
-- DOKTER AMBIS
-- Migration 0004
-- File : 0004_profiles.sql
-- Purpose : User profile data
-- =========================================================

CREATE TABLE profiles (

    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    full_name VARCHAR(150) NOT NULL,

    avatar_path TEXT,

    role profile_role
        NOT NULL DEFAULT 'student',

    status profile_status
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_profiles_full_name
        CHECK(length(trim(full_name)) > 0)
);

CREATE INDEX idx_profiles_role
ON profiles(role);

CREATE INDEX idx_profiles_status
ON profiles(status);

CREATE INDEX idx_profiles_created_at
ON profiles(created_at);