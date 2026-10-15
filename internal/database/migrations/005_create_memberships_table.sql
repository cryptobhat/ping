-- Migration: 005_create_memberships_table
-- Description: Creates the memberships table for conversation participants
-- This tracks which users are in which conversations

CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create unique constraint on conversation_id + user_id + device_id
-- This ensures a user can only join a conversation once per device
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_unique_user_conversation 
    ON memberships(conversation_id, user_id, device_id) WHERE device_id IS NOT NULL;

-- Create unique constraint on conversation_id + user_id when device_id is null
-- This ensures a user can only join a conversation once (across all devices)
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_unique_user_conversation_all_devices 
    ON memberships(conversation_id, user_id) WHERE device_id IS NULL;

-- Create index for finding memberships by conversation_id
CREATE INDEX IF NOT EXISTS idx_memberships_conversation ON memberships(conversation_id);

-- Create index for finding memberships by user_id
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

-- Create index for active memberships in a conversation
CREATE INDEX IF NOT EXISTS idx_memberships_active ON memberships(conversation_id, user_id) WHERE is_active = TRUE;

-- Create index for conversation members (for group chats)
CREATE INDEX IF NOT EXISTS idx_memberships_conversation_active ON memberships(conversation_id) WHERE is_active = TRUE;

-- Add comments
COMMENT ON TABLE memberships IS 'Tracks which users are participants in which conversations.';
COMMENT ON COLUMN memberships.device_id IS 'Optional - if null, membership applies to all user devices. If set, applies to specific device.';
COMMENT ON COLUMN memberships.role IS 'User role: "member", "admin", or "owner".';
COMMENT ON COLUMN memberships.joined_at IS 'When the user joined the conversation.';
COMMENT ON COLUMN memberships.left_at IS 'When the user left the conversation (null if still a member).';
COMMENT ON COLUMN memberships.is_active IS 'Whether the user is currently a member of the conversation.';
