-- =========================================================
-- DOKTER AMBIS
-- Migration 0015
-- File : 0015_quiz_questions.sql
-- Purpose : Quiz questions
-- =========================================================

CREATE TABLE quiz_questions (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    quiz_id UUID NOT NULL,

    question_order INTEGER NOT NULL,

    question TEXT NOT NULL,

    explanation TEXT,

    image_path TEXT,

    question_type VARCHAR(20)
        NOT NULL DEFAULT 'single_choice',

    points INTEGER
        NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quiz_questions_quiz
        FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_quiz_questions_order
        UNIQUE (quiz_id, question_order),

    CONSTRAINT chk_quiz_questions_question
        CHECK(length(trim(question)) > 0),

    CONSTRAINT chk_quiz_questions_explanation
        CHECK(
            explanation IS NULL
            OR length(trim(explanation)) > 0
        ),

    CONSTRAINT chk_quiz_questions_image_path
        CHECK(
            image_path IS NULL
            OR length(trim(image_path)) > 0
        ),

    CONSTRAINT chk_quiz_questions_order
        CHECK(question_order > 0),

    CONSTRAINT chk_quiz_questions_points
        CHECK(points > 0),

    CONSTRAINT chk_quiz_questions_type
        CHECK(
            question_type IN (
                'single_choice',
                'multiple_choice'
            )
        )
);

CREATE INDEX idx_quiz_questions_quiz
ON quiz_questions(quiz_id);

CREATE INDEX idx_quiz_questions_order
ON quiz_questions(quiz_id, question_order);

CREATE INDEX idx_quiz_questions_created_at
ON quiz_questions(created_at);