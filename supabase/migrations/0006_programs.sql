-- =========================================================
-- DOKTER AMBIS
-- Migration 0006
-- File : 0006_programs.sql
-- Purpose : Learning Programs
-- =========================================================

CREATE TABLE programs (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    slug VARCHAR(100) NOT NULL,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    thumbnail_path TEXT,

    status program_status
        NOT NULL DEFAULT 'coming_soon',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_programs_slug
        UNIQUE(slug),

    CONSTRAINT chk_programs_slug
        CHECK(length(trim(slug)) > 0),

    CONSTRAINT chk_programs_title
        CHECK(length(trim(title)) > 0)
);

CREATE INDEX idx_programs_status
ON programs(status);

CREATE INDEX idx_programs_created_at
ON programs(created_at);