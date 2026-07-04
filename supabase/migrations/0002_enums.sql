-- =========================================================
-- DOKTER AMBIS
-- Migration 0002
-- File : 0002_enums.sql
-- Purpose : Create all enum types
-- =========================================================

-- =========================================================
-- PROFILE
-- =========================================================

CREATE TYPE profile_role AS ENUM (
    'admin',
    'mentor',
    'student'
);

CREATE TYPE profile_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);

-- =========================================================
-- ORGANIZATION
-- =========================================================

CREATE TYPE organization_status AS ENUM (
    'active',
    'inactive'
);

-- =========================================================
-- PROGRAM
-- =========================================================

CREATE TYPE program_status AS ENUM (
    'coming_soon',
    'active',
    'inactive'
);

-- =========================================================
-- COURSE
-- =========================================================

CREATE TYPE course_status AS ENUM (
    'draft',
    'active',
    'archived'
);

-- =========================================================
-- ENROLLMENT
-- =========================================================

CREATE TYPE enrollment_category AS ENUM (
    'regular',
    'separated'
);

CREATE TYPE enrollment_status AS ENUM (
    'pending_payment',
    'pending_approval',
    'active',
    'expired',
    'cancelled'
);

-- =========================================================
-- PAYMENT
-- =========================================================

CREATE TYPE payment_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE payment_method AS ENUM (
    'bank_transfer',
    'qris',
    'free'
);

-- =========================================================
-- DEVICE
-- =========================================================

CREATE TYPE device_type AS ENUM (
    'desktop',
    'laptop',
    'tablet',
    'mobile'
);

-- =========================================================
-- FILE
-- =========================================================

CREATE TYPE file_type AS ENUM (
    'pdf',
    'ppt',
    'pptx',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'zip',
    'mp3'
);

-- =========================================================
-- VIDEO
-- =========================================================

CREATE TYPE video_provider AS ENUM (
    'youtube',
    'bunny',
    'upload'
);