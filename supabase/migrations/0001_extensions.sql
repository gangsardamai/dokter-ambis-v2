-- =========================================================
-- DOKTER AMBIS
-- Migration 0001
-- File : 0001_extensions.sql
-- Purpose : Enable required PostgreSQL extensions
-- =========================================================

-- UUID Generator
CREATE EXTENSION IF NOT EXISTS pgcrypto;