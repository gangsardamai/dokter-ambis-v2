-- =========================================================
-- DOKTER AMBIS
-- Migration 0020
-- File : 0020_payments.sql
-- Purpose : Manual payment transactions
-- =========================================================

CREATE TABLE payments (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    enrollment_id UUID NOT NULL,

    amount NUMERIC(12,2)
        NOT NULL,

    payment_method payment_method
        NOT NULL DEFAULT 'bank_transfer',

    payment_proof_path TEXT,

    status payment_status
        NOT NULL DEFAULT 'pending',

    paid_at TIMESTAMPTZ,

    verified_at TIMESTAMPTZ,

    verified_by UUID,

    notes TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payments_enrollment
        FOREIGN KEY(enrollment_id)
        REFERENCES enrollments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payments_verifier
        FOREIGN KEY(verified_by)
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_payments_enrollment
        UNIQUE(enrollment_id),

    CONSTRAINT chk_payments_amount
        CHECK(amount >= 0),

    CONSTRAINT chk_payments_payment_proof_path
        CHECK(
            payment_proof_path IS NULL
            OR length(trim(payment_proof_path)) > 0
        ),

    CONSTRAINT chk_payments_notes
        CHECK(
            notes IS NULL
            OR length(trim(notes)) > 0
        ),

    CONSTRAINT chk_payments_verified_at
        CHECK(
            verified_at IS NULL
            OR paid_at IS NULL
            OR verified_at >= paid_at
        ),

    CONSTRAINT chk_payments_verified_by
        CHECK(
            verified_at IS NULL
            OR verified_by IS NOT NULL
        )
);

CREATE INDEX idx_payments_enrollment
ON payments(enrollment_id);

CREATE INDEX idx_payments_status
ON payments(status);

CREATE INDEX idx_payments_verified_by
ON payments(verified_by);

CREATE INDEX idx_payments_created_at
ON payments(created_at);