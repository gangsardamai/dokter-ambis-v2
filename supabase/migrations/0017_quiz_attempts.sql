-- =========================================================
-- DOKTER AMBIS
-- Migration 0017
-- File : 0017_quiz_attempts.sql
-- Purpose : Quiz attempts
-- =========================================================

CREATE TABLE quiz_attempts (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL,

    quiz_id UUID NOT NULL,

    attempt_number INTEGER NOT NULL,

    total_questions INTEGER NOT NULL,

    total_correct INTEGER
        NOT NULL DEFAULT 0,

    total_wrong INTEGER
        NOT NULL DEFAULT 0,

    total_unanswered INTEGER
        NOT NULL DEFAULT 0,

    score NUMERIC(5,2),

    started_at TIMESTAMPTZ NOT NULL,

    submitted_at TIMESTAMPTZ,

    duration_seconds INTEGER,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quiz_attempts_profile
        FOREIGN KEY(profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_quiz_attempts_quiz
        FOREIGN KEY(quiz_id)
        REFERENCES quizzes(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_quiz_attempts
        UNIQUE(profile_id, quiz_id, attempt_number),

    CONSTRAINT chk_quiz_attempts_attempt_number
        CHECK(attempt_number > 0),

    CONSTRAINT chk_quiz_attempts_total_questions
        CHECK(total_questions > 0),

    CONSTRAINT chk_quiz_attempts_total_correct
        CHECK(total_correct >= 0),

    CONSTRAINT chk_quiz_attempts_total_wrong
        CHECK(total_wrong >= 0),

    CONSTRAINT chk_quiz_attempts_total_unanswered
        CHECK(total_unanswered >= 0),

    CONSTRAINT chk_quiz_attempts_score
        CHECK(
            score IS NULL
            OR (score >= 0 AND score <= 100)
        ),

    CONSTRAINT chk_quiz_attempts_duration
        CHECK(
            duration_seconds IS NULL
            OR duration_seconds >= 0
        ),

    CONSTRAINT chk_quiz_attempts_submitted
        CHECK(
            submitted_at IS NULL
            OR submitted_at >= started_at
        ),

    CONSTRAINT chk_quiz_attempts_total_answer
        CHECK(
            total_correct
            + total_wrong
            + total_unanswered
            = total_questions
        )
);

CREATE INDEX idx_quiz_attempts_profile
ON quiz_attempts(profile_id);

CREATE INDEX idx_quiz_attempts_quiz
ON quiz_attempts(quiz_id);

CREATE INDEX idx_quiz_attempts_profile_quiz
ON quiz_attempts(profile_id, quiz_id);

CREATE INDEX idx_quiz_attempts_created_at
ON quiz_attempts(created_at);