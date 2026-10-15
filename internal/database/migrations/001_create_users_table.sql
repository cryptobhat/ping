-- Migration: 001_create_users_table
-- Description: Creates the users table for storing user accounts
-- This is the foundation of the application

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    avatar_url TEXT,
    status TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index for email lookups (email is optional but we still want fast lookups)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Create index for phone lookups (phone is optional)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Create index for last_seen_at for presence features
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Add a comment to explain the table
COMMENT ON TABLE users IS 'Stores user account information. Username is the primary identifier.';
COMMENT ON COLUMN users.password_hash IS 'SHA-256 hash of the password with a random salt.';
COMMENT ON COLUMN users.salt IS 'Random salt used in password hashing.';
COMMENT ON COLUMN users.avatar_url IS 'URL to the user\'s profile picture in encrypted storage.';
