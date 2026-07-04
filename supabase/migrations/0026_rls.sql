-- =========================================================
-- DOKTER AMBIS
-- Migration 0026
-- File : 0026_rls.sql
-- Purpose : Enable Row Level Security & Policies
-- =========================================================

-- =========================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PUBLIC READ POLICIES
-- =========================================================

CREATE POLICY organizations_public_read
ON organizations
FOR SELECT
USING (true);

CREATE POLICY programs_public_read
ON programs
FOR SELECT
USING (true);

CREATE POLICY courses_public_read
ON courses
FOR SELECT
USING (
    status = 'active'
);

CREATE POLICY mentor_details_public_read
ON mentor_details
FOR SELECT
USING (true);

CREATE POLICY course_mentors_public_read
ON course_mentors
FOR SELECT
USING (true);

CREATE POLICY lessons_public_read
ON lessons
FOR SELECT
USING (true);

CREATE POLICY videos_public_read
ON videos
FOR SELECT
USING (true);

CREATE POLICY lesson_files_public_read
ON lesson_files
FOR SELECT
USING (true);

CREATE POLICY live_classes_public_read
ON live_classes
FOR SELECT
USING (true);

CREATE POLICY quizzes_public_read
ON quizzes
FOR SELECT
USING (true);

CREATE POLICY quiz_questions_public_read
ON quiz_questions
FOR SELECT
USING (true);

CREATE POLICY quiz_options_public_read
ON quiz_options
FOR SELECT
USING (true);

CREATE POLICY announcements_public_read
ON course_announcements
FOR SELECT
USING (
    is_published = true
);

-- =========================================================
-- PROFILE POLICIES
-- =========================================================

CREATE POLICY profiles_select_self
ON profiles
FOR SELECT
USING (
    auth.uid() = id
);

CREATE POLICY profiles_update_self
ON profiles
FOR UPDATE
USING (
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
);

-- =========================================================
-- ENROLLMENT POLICIES
-- =========================================================

CREATE POLICY enrollments_owner
ON enrollments
FOR ALL
USING (
    profile_id = auth.uid()
)
WITH CHECK (
    profile_id = auth.uid()
);

CREATE POLICY payments_owner
ON payments
FOR ALL
USING (
    enrollment_id IN (
        SELECT id
        FROM enrollments
        WHERE profile_id = auth.uid()
    )
)
WITH CHECK (
    enrollment_id IN (
        SELECT id
        FROM enrollments
        WHERE profile_id = auth.uid()
    )
);

CREATE POLICY lesson_progress_owner
ON lesson_progress
FOR ALL
USING (
    profile_id = auth.uid()
)
WITH CHECK (
    profile_id = auth.uid()
);

CREATE POLICY quiz_attempts_owner
ON quiz_attempts
FOR ALL
USING (
    profile_id = auth.uid()
)
WITH CHECK (
    profile_id = auth.uid()
);

CREATE POLICY quiz_answers_owner
ON quiz_answers
FOR ALL
USING (
    attempt_id IN (
        SELECT id
        FROM quiz_attempts
        WHERE profile_id = auth.uid()
    )
)
WITH CHECK (
    attempt_id IN (
        SELECT id
        FROM quiz_attempts
        WHERE profile_id = auth.uid()
    )
);

CREATE POLICY device_sessions_owner
ON device_sessions
FOR ALL
USING (
    profile_id = auth.uid()
)
WITH CHECK (
    profile_id = auth.uid()
);

-- =========================================================
-- ACTIVITY LOGS
-- =========================================================

CREATE POLICY activity_logs_owner
ON activity_logs
FOR SELECT
USING (
    profile_id = auth.uid()
);