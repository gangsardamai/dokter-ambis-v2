-- =========================================================
-- DOKTER AMBIS
-- Migration 0014
-- File : 0014_quizzes.sql
-- Purpose : Lesson quizzes
-- =========================================================

CREATE TABLE quizzes (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    lesson_id UUID NOT NULL,

    title VARCHAR(150) NOT NULL,

    total_questions INTEGER NOT NULL,

    duration INTEGER NOT NULL,

    max_attempt INTEGER
        NOT NULL DEFAULT 2,

    passing_score INTEGER
        NOT NULL DEFAULT 70,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quizzes_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_quizzes_lesson
        UNIQUE(lesson_id),

    CONSTRAINT chk_quizzes_title
        CHECK(length(trim(title)) > 0),

    CONSTRAINT chk_quizzes_total_questions
        CHECK(total_questions > 0),

    CONSTRAINT chk_quizzes_duration
        CHECK(duration > 0),

    CONSTRAINT chk_quizzes_max_attempt
        CHECK(max_attempt > 0),

    CONSTRAINT chk_quizzes_passing_score
        CHECK(
            passing_score >= 0
            AND passing_score <= 100
        )
);

CREATE INDEX idx_quizzes_lesson
ON quizzes(lesson_id);

CREATE INDEX idx_quizzes_created_at
ON quizzes(created_at);