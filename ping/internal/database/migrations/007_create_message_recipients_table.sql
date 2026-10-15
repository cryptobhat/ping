-- Migration: 007_create_message_recipients_table
-- Description: Creates the message_recipients table for tracking message delivery
-- This tracks the delivery status of messages to individual recipients

CREATE TABLE IF NOT EXISTS message_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create unique index on message_id + user_id + device_id
-- This ensures we don't have duplicate delivery records
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_recipients_unique 
    ON message_recipients(message_id, user_id, device_id);

-- Create index for finding recipients of a message
CREATE INDEX IF NOT EXISTS idx_message_recipients_message ON message_recipients(message_id);

-- Create index for finding messages for a specific user/device
CREATE INDEX IF NOT EXISTS idx_message_recipients_user_device ON message_recipients(user_id, device_id);

-- Create index for pending deliveries (not yet delivered)
CREATE INDEX IF NOT EXISTS idx_message_recipients_pending ON message_recipients(status) WHERE status IN ('sent', 'failed');

-- Create index for messages that need retry
CREATE INDEX IF NOT EXISTS idx_message_recipients_retry ON message_recipients(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_message_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_message_recipients_updated_at ON message_recipients;
CREATE TRIGGER trigger_update_message_recipients_updated_at
    BEFORE UPDATE ON message_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_message_recipients_updated_at();

-- Add comments
COMMENT ON TABLE message_recipients IS 'Tracks delivery status of messages to individual recipient devices.';
COMMENT ON COLUMN message_recipients.message_id IS 'The message being delivered.';
COMMENT ON COLUMN message_recipients.user_id IS 'The recipient user.';
COMMENT ON COLUMN message_recipients.device_id IS 'The specific device of the recipient.';
COMMENT ON COLUMN message_recipients.status IS 'Delivery status: sent, delivered, read, or failed.';
COMMENT ON COLUMN message_recipients.read_at IS 'When the recipient read the message.';
COMMENT ON COLUMN message_recipients.delivered_at IS 'When the message was delivered to the device.';
COMMENT ON COLUMN message_recipients.error IS 'Any error that occurred during delivery.';
COMMENT ON COLUMN message_recipients.retry_count IS 'Number of times delivery has been attempted.';
COMMENT ON COLUMN message_recipients.next_retry_at IS 'When the next delivery attempt should be made.';
