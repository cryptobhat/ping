-- Migration: 009_create_live_locations_table
-- Description: Creates tables for live location sharing
-- This allows users to share their location in real-time

-- Live location sessions table
CREATE TABLE IF NOT EXISTS live_location_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for finding active live location sessions
CREATE INDEX IF NOT EXISTS idx_live_location_sessions_active ON live_location_sessions(is_active) WHERE is_active = TRUE;

-- Create index for finding sessions by user
CREATE INDEX IF NOT EXISTS idx_live_location_sessions_user ON live_location_sessions(user_id);

-- Create index for finding sessions by conversation
CREATE INDEX IF NOT EXISTS idx_live_location_sessions_conversation ON live_location_sessions(conversation_id);

-- Create index for finding sessions that will expire
CREATE INDEX IF NOT EXISTS idx_live_location_sessions_expires ON live_location_sessions(expires_at);

-- Live location updates table
CREATE TABLE IF NOT EXISTS live_location_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES live_location_sessions(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    address TEXT,
    map_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for finding updates by session
CREATE INDEX IF NOT EXISTS idx_live_location_updates_session ON live_location_updates(session_id);

-- Create index for finding updates by timestamp
CREATE INDEX IF NOT EXISTS idx_live_location_updates_timestamp ON live_location_updates(timestamp DESC);

-- Create trigger to update last_update on session
CREATE OR REPLACE FUNCTION update_live_location_session_last_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE live_location_sessions 
    SET last_update = NOW(), updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_live_location_session ON live_location_updates;
CREATE TRIGGER trigger_update_live_location_session
    AFTER INSERT ON live_location_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_live_location_session_last_update();

-- Create trigger to update updated_at on live_location_sessions
CREATE OR REPLACE FUNCTION update_live_location_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_live_location_sessions_updated_at ON live_location_sessions;
CREATE TRIGGER trigger_update_live_location_sessions_updated_at
    BEFORE UPDATE ON live_location_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_live_location_sessions_updated_at();

-- Add comments
COMMENT ON TABLE live_location_sessions IS 'Stores active live location sharing sessions.';
COMMENT ON COLUMN live_location_sessions.user_id IS 'The user who is sharing their location.';
COMMENT ON COLUMN live_location_sessions.conversation_id IS 'The conversation where the location is shared.';
COMMENT ON COLUMN live_location_sessions.expires_at IS 'When the live location sharing will automatically stop.';
COMMENT ON COLUMN live_location_sessions.is_active IS 'Whether the location sharing is currently active.';

COMMENT ON TABLE live_location_updates IS 'Stores location updates during a live location session.';
COMMENT ON COLUMN live_location_updates.latitude IS 'Latitude of the location.';
COMMENT ON COLUMN live_location_updates.longitude IS 'Longitude of the location.';
COMMENT ON COLUMN live_location_updates.accuracy IS 'Accuracy of the location in meters.';
COMMENT ON COLUMN live_location_updates.address IS 'Human-readable address (optional).';
