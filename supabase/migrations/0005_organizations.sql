-- =========================================================
-- DOKTER AMBIS
-- Migration 0005
-- File : 0005_organizations.sql
-- Purpose : Organizations (University / Institution)
-- =========================================================

CREATE TABLE organizations (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    slug VARCHAR(100) NOT NULL,

    title VARCHAR(150) NOT NULL,

    short_name VARCHAR(30) NOT NULL,

    logo_path TEXT,

    status organization_status
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_organizations_slug
        UNIQUE(slug),

    CONSTRAINT uq_organizations_short_name
        UNIQUE(short_name),

    CONSTRAINT chk_organizations_slug
        CHECK(length(trim(slug)) > 0),

    CONSTRAINT chk_organizations_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT chk_organizations_short_name
        CHECK(length(trim(short_name)) > 0)
);

CREATE INDEX idx_organizations_status
ON organizations(status);

CREATE INDEX idx_organizations_created_at
ON organizations(created_at);