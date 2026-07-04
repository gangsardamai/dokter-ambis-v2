-- =========================================================
-- DOKTER AMBIS
-- Migration 0027
-- File : 0027_seed.sql
-- Purpose : Initial Seed Data
-- =========================================================

-- =========================================================
-- Programs
-- =========================================================

INSERT INTO programs (
    slug,
    title,
    description,
    status
)
VALUES
(
    'belajar-sesuai-blok',
    'Program Belajar Sesuai Blok',
    'Program pembelajaran berdasarkan blok universitas.',
    'active'
),
(
    'ukmppd',
    'Program UKMPPD',
    'Persiapan menghadapi UKMPPD.',
    'coming_soon'
)
ON CONFLICT (slug)
DO NOTHING;

-- =========================================================
-- Organizations
-- =========================================================

INSERT INTO organizations (
    slug,
    title,
    short_name
)
VALUES
(
    'ui',
    'Universitas Indonesia',
    'UI'
),
(
    'unair',
    'Universitas Airlangga',
    'UNAIR'
),
(
    'unej',
    'Universitas Jember',
    'UNEJ'
)
ON CONFLICT (slug)
DO NOTHING;