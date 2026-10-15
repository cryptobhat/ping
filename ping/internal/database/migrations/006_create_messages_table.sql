-- Migration: 006_create_messages_table
-- Description: Creates the messages table for storing encrypted messages
-- This is the core table for the messaging functionality

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    content BYTEA NOT NULL,
    ciphertext_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    idempotency_key VARCHAR(255) NOT NULL,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_forwarded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for messages in a conversation (sorted by timestamp)
-- This is the primary query pattern: "get messages in conversation X"
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp ON messages(conversation_id, timestamp DESC);

-- Create index for finding messages by sender
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);

-- Create unique index on idempotency_key to prevent duplicate messages
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_idempotency_key ON messages(idempotency_key);

-- Create index for finding messages by conversation_id
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Create index for finding replies to a message
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id);

-- Create index for finding deleted messages
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted) WHERE is_deleted = TRUE;

-- Create index for message status
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(conversation_id, status);

-- Add comments
COMMENT ON TABLE messages IS 'Stores encrypted messages. The server NEVER sees plaintext content.';
COMMENT ON COLUMN messages.content IS 'Encrypted ciphertext using Signal Protocol. Server cannot decrypt this.';
COMMENT ON COLUMN messages.ciphertext_type IS 'Indicates the encryption scheme (e.g., "signal_message_v3").';
COMMENT ON COLUMN messages.timestamp IS 'Client-generated timestamp for message ordering.';
COMMENT ON COLUMN messages.server_timestamp IS 'Server-received timestamp.';
COMMENT ON COLUMN messages.idempotency_key IS 'Client-generated key to prevent duplicate messages from retries.';
COMMENT ON COLUMN messages.status IS 'Delivery status: sent, delivered, read, or failed.';
COMMENT ON COLUMN messages.reply_to_message_id IS 'The message this is replying to (for quote replies).';
