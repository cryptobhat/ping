-- Migration: 003_create_prekeys_table
-- Description: Creates the prekeys table for storing one-time prekeys
-- These are essential for Signal Protocol's X3DH key exchange

CREATE TABLE IF NOT EXISTS prekeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    prekey_id INTEGER NOT NULL,
    public_key BYTEA NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create unique constraint on device_id + prekey_id
-- This ensures a device can't have duplicate prekey IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_prekeys_unique_device_prekey 
    ON prekeys(device_id, prekey_id);

-- Create index for finding unused prekeys for a device
CREATE INDEX IF NOT EXISTS idx_prekeys_unused ON prekeys(device_id) WHERE is_used = FALSE;

-- Create index for finding prekeys by device_id
CREATE INDEX IF NOT EXISTS idx_prekeys_device_id ON prekeys(device_id);

-- Add comments
COMMENT ON TABLE prekeys IS 'Stores one-time prekeys for Signal Protocol. These are ephemeral keys used in the X3DH handshake.';
COMMENT ON COLUMN prekeys.prekey_id IS 'Numeric ID assigned by the client device.';
COMMENT ON COLUMN prekeys.public_key IS 'Elliptic curve public key (Curve25519 in Signal Protocol).';
COMMENT ON COLUMN prekeys.is_used IS 'Once a prekey is used, it should never be used again.';
