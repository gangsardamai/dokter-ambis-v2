-- =========================================================
-- DOKTER AMBIS
-- Migration 0018
-- File : 0018_quiz_answers.sql
-- Purpose : Quiz answers
-- =========================================================

CREATE TABLE quiz_answers (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    attempt_id UUID NOT NULL,

    question_id UUID NOT NULL,

    selected_option_id UUID,

    is_correct BOOLEAN,

    answered_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quiz_answers_attempt
        FOREIGN KEY(attempt_id)
        REFERENCES quiz_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_quiz_answers_question
        FOREIGN KEY(question_id)
        REFERENCES quiz_questions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_quiz_answers_option
        FOREIGN KEY(selected_option_id)
        REFERENCES quiz_options(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_quiz_answers_question
        UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_quiz_answers_attempt
ON quiz_answers(attempt_id);

CREATE INDEX idx_quiz_answers_question
ON quiz_answers(question_id);

CREATE INDEX idx_quiz_answers_option
ON quiz_answers(selected_option_id);

CREATE INDEX idx_quiz_answers_created_at
ON quiz_answers(created_at);