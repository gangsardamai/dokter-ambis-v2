-- =========================================================
-- DOKTER AMBIS
-- Migration 0007
-- File : 0007_courses.sql
-- Purpose : Learning Courses
-- =========================================================

CREATE TABLE courses (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    program_id UUID NOT NULL,

    slug VARCHAR(100) NOT NULL,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    thumbnail_path TEXT,

    status course_status
        NOT NULL DEFAULT 'draft',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_courses_slug
        UNIQUE(slug),

    CONSTRAINT chk_courses_slug
        CHECK(length(trim(slug)) > 0),

    CONSTRAINT chk_courses_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT fk_courses_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_courses_program
        FOREIGN KEY (program_id)
        REFERENCES programs(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_courses_organization
ON courses(organization_id);

CREATE INDEX idx_courses_program
ON courses(program_id);

CREATE INDEX idx_courses_status
ON courses(status);

CREATE INDEX idx_courses_created_at
ON courses(created_at);