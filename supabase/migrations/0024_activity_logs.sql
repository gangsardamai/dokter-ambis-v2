-- =========================================================
-- DOKTER AMBIS
-- Migration 0024
-- File : 0024_activity_logs.sql
-- Purpose : System activity logs
-- =========================================================

CREATE TABLE activity_logs (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    profile_id UUID,

    action VARCHAR(100)
        NOT NULL,

    entity_type VARCHAR(100)
        NOT NULL,

    entity_id UUID,

    description TEXT,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_activity_logs_profile
        FOREIGN KEY(profile_id)
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_activity_logs_action
        CHECK(length(trim(action)) > 0),

    CONSTRAINT chk_activity_logs_entity_type
        CHECK(length(trim(entity_type)) > 0),

    CONSTRAINT chk_activity_logs_description
        CHECK(
            description IS NULL
            OR length(trim(description)) > 0
        ),

    CONSTRAINT chk_activity_logs_user_agent
        CHECK(
            user_agent IS NULL
            OR length(trim(user_agent)) > 0
        )
);

CREATE INDEX idx_activity_logs_profile
ON activity_logs(profile_id);

CREATE INDEX idx_activity_logs_action
ON activity_logs(action);

CREATE INDEX idx_activity_logs_entity
ON activity_logs(entity_type, entity_id);

CREATE INDEX idx_activity_logs_created
ON activity_logs(created_at);

CREATE INDEX idx_activity_logs_profile_created
ON activity_logs(profile_id, created_at DESC);