-- =========================================================
-- DOKTER AMBIS
-- Migration 0032
-- File : 0032_promotions.sql
-- Purpose : Promotions Master
-- =========================================================

CREATE TABLE promotions (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    code VARCHAR(50),

    name VARCHAR(150)
        NOT NULL,

    type promotion_type
        NOT NULL,

    value NUMERIC(12,0)
        NOT NULL,

    requires_code BOOLEAN
        NOT NULL DEFAULT TRUE,

    priority INTEGER
        NOT NULL DEFAULT 100,

    quota INTEGER,

    start_at TIMESTAMPTZ
        NOT NULL,

    end_at TIMESTAMPTZ,

    status promotion_status
        NOT NULL DEFAULT 'active',

    description TEXT,

    notes TEXT,

    created_by UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_promotions_code
        UNIQUE (code),

    CONSTRAINT chk_promotions_name
        CHECK (length(trim(name)) > 0),

    CONSTRAINT chk_promotions_priority
        CHECK (priority > 0),

    CONSTRAINT chk_promotions_quota
        CHECK (
            quota IS NULL
            OR quota > 0
        ),

    CONSTRAINT chk_promotions_dates
        CHECK (
            end_at IS NULL
            OR end_at >= start_at
        ),

    CONSTRAINT chk_promotions_code
        CHECK (
            requires_code = FALSE
            OR (
                code IS NOT NULL
                AND length(trim(code)) > 0
            )
        )
);

CREATE INDEX idx_promotions_status
ON promotions(status);

CREATE INDEX idx_promotions_type
ON promotions(type);

CREATE INDEX idx_promotions_start_at
ON promotions(start_at);

CREATE INDEX idx_promotions_end_at
ON promotions(end_at);

CREATE INDEX idx_promotions_created_by
ON promotions(created_by);