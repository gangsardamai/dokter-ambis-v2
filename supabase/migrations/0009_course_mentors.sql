-- =========================================================
-- DOKTER AMBIS
-- Migration 0009
-- File : 0009_course_mentors.sql
-- Purpose : Many-to-many relation between courses and mentors
-- =========================================================

CREATE TABLE course_mentors (

    course_id UUID NOT NULL,

    mentor_id UUID NOT NULL,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        course_id,
        mentor_id
    ),

    CONSTRAINT fk_course_mentors_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_course_mentors_mentor
        FOREIGN KEY (mentor_id)
        REFERENCES mentor_details(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_course_mentors_mentor
ON course_mentors(mentor_id);