-- Migration: 008_create_reports_table
-- Description: Creates the reports table for user reporting system
-- This allows users to report abusive accounts

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for finding reports by reporter
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

-- Create index for finding reports by reported user
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);

-- Create index for finding reports by status
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Create index for finding reports by message
CREATE INDEX IF NOT EXISTS idx_reports_message ON reports(reported_message_id);

-- Create index for pending reports
CREATE INDEX IF NOT EXISTS idx_reports_pending ON reports(status) WHERE status = 'pending';

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reports_updated_at ON reports;
CREATE TRIGGER trigger_update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- Add comments
COMMENT ON TABLE reports IS 'Stores user reports for abusive content or behavior.';
COMMENT ON COLUMN reports.reporter_id IS 'The user who filed the report.';
COMMENT ON COLUMN reports.reported_user_id IS 'The user being reported.';
COMMENT ON COLUMN reports.reported_message_id IS 'The specific message being reported (optional).';
COMMENT ON COLUMN reports.reason IS 'Why the user is being reported.';
COMMENT ON COLUMN reports.category IS 'Type of report: spam, abuse, harassment, etc.';
COMMENT ON COLUMN reports.status IS 'Current status: pending, in_review, resolved, dismissed, actioned.';
