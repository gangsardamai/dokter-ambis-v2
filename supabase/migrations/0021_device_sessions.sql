-- =========================================================
-- DOKTER AMBIS
-- Migration 0021
-- File : 0021_device_sessions.sql
-- Purpose : Active device sessions
-- =========================================================

CREATE TABLE device_sessions (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL,

    device_name VARCHAR(100) NOT NULL,

    device_type device_type
        NOT NULL,

    device_identifier VARCHAR(255) NOT NULL,

    ip_address INET,

    user_agent TEXT,

    last_login_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    last_activity_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    is_active BOOLEAN
        NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_device_sessions_profile
        FOREIGN KEY(profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_device_sessions_profile_identifier
        UNIQUE(profile_id, device_identifier),

    CONSTRAINT chk_device_sessions_name
        CHECK(length(trim(device_name)) > 0),

    CONSTRAINT chk_device_sessions_identifier
        CHECK(length(trim(device_identifier)) > 0),

    CONSTRAINT chk_device_sessions_user_agent
        CHECK(
            user_agent IS NULL
            OR length(trim(user_agent)) > 0
        ),

    CONSTRAINT chk_device_sessions_activity
        CHECK(
            last_activity_at >= last_login_at
        )
);

CREATE INDEX idx_device_sessions_profile
ON device_sessions(profile_id);

CREATE INDEX idx_device_sessions_active
ON device_sessions(is_active);

CREATE INDEX idx_device_sessions_profile_active
ON device_sessions(profile_id, is_active);

CREATE INDEX idx_device_sessions_created_at
ON device_sessions(created_at);