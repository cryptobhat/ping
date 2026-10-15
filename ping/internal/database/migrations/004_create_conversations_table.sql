-- Migration: 004_create_conversations_table
-- Description: Creates the conversations table for storing chat conversations
-- This includes both 1-to-1 and group conversations

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100),
    avatar_url TEXT,
    description TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    muted_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_id UUID
);

-- Create index for conversation type
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- Create index for creator_id
CREATE INDEX IF NOT EXISTS idx_conversations_creator ON conversations(creator_id);

-- Create index for last_message_at for ordering conversations
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Create index for muted conversations
CREATE INDEX IF NOT EXISTS idx_conversations_muted ON conversations(is_muted) WHERE is_muted = TRUE;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversations_updated_at();

-- Add comments
COMMENT ON TABLE conversations IS 'Stores chat conversations, both 1-to-1 and group.';
COMMENT ON COLUMN conversations.type IS 'Either "direct" for 1-to-1 or "group" for group conversations.';
COMMENT ON COLUMN conversations.creator_id IS 'The user who created the conversation.';
COMMENT ON COLUMN conversations.title IS 'Display name for the conversation (for groups, this is set by creator).';
COMMENT ON COLUMN conversations.is_encrypted IS 'Should always be TRUE in our system - all messages are encrypted.';
COMMENT ON COLUMN conversations.is_archived IS 'Whether the user has archived this conversation.';
COMMENT ON COLUMN conversations.is_muted IS 'Whether notifications for this conversation are muted.';
