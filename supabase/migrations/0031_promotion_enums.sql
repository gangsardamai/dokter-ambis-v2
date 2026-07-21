-- =========================================================
-- DOKTER AMBIS
-- Migration 0031
-- File : 0031_promotion_enums.sql
-- Purpose : Promotion Enums
-- =========================================================

CREATE TYPE promotion_type AS ENUM (

    'fixed_discount',
    'percentage',
    'fixed_price',
    'free'

);

CREATE TYPE promotion_status AS ENUM (

    'active',
    'inactive'

);