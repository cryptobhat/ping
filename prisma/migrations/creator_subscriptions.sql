-- Creator Subscriptions feature migration
-- Run against production DB once (PostgreSQL). Safe to re-run with IF NOT EXISTS.

-- Add creator fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "creatorPriceINR" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isCreatorEligible" BOOLEAN NOT NULL DEFAULT false;

-- Add membersOnly field to content table
ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "membersOnly" BOOLEAN NOT NULL DEFAULT false;

-- Create creator_subscriptions table
CREATE TABLE IF NOT EXISTS "creator_subscriptions" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "priceINR" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint (one active subscription per subscriber-creator pair)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creator_subscriptions_subscriberId_creatorId_key'
  ) THEN
    ALTER TABLE "creator_subscriptions"
      ADD CONSTRAINT "creator_subscriptions_subscriberId_creatorId_key"
      UNIQUE ("subscriberId", "creatorId");
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "creator_subscriptions_creatorId_idx" ON "creator_subscriptions"("creatorId");
CREATE INDEX IF NOT EXISTS "creator_subscriptions_subscriberId_idx" ON "creator_subscriptions"("subscriberId");
CREATE INDEX IF NOT EXISTS "creator_subscriptions_endDate_idx" ON "creator_subscriptions"("endDate");

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creator_subscriptions_subscriberId_fkey'
  ) THEN
    ALTER TABLE "creator_subscriptions"
      ADD CONSTRAINT "creator_subscriptions_subscriberId_fkey"
      FOREIGN KEY ("subscriberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creator_subscriptions_creatorId_fkey'
  ) THEN
    ALTER TABLE "creator_subscriptions"
      ADD CONSTRAINT "creator_subscriptions_creatorId_fkey"
      FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
