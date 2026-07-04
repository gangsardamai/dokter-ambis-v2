-- =========================================================
-- DOKTER AMBIS
-- Migration 0016
-- File : 0016_quiz_options.sql
-- Purpose : Quiz answer options
-- =========================================================

CREATE TABLE quiz_options (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    question_id UUID NOT NULL,

    option_order INTEGER NOT NULL,

    option_text TEXT NOT NULL,

    image_path TEXT,

    is_correct BOOLEAN
        NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quiz_options_question
        FOREIGN KEY (question_id)
        REFERENCES quiz_questions(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_quiz_options_order
        UNIQUE(question_id, option_order),

    CONSTRAINT chk_quiz_options_text
        CHECK(length(trim(option_text)) > 0),

    CONSTRAINT chk_quiz_options_image_path
        CHECK(
            image_path IS NULL
            OR length(trim(image_path)) > 0
        ),

    CONSTRAINT chk_quiz_options_order
        CHECK(option_order > 0)
);

CREATE INDEX idx_quiz_options_question
ON quiz_options(question_id);

CREATE INDEX idx_quiz_options_created_at
ON quiz_options(created_at);