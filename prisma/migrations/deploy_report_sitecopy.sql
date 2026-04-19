-- Run against production DB once (PostgreSQL). Safe to re-run with IF NOT EXISTS where supported.

ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "resolvedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "reports_resolvedByUserId_idx" ON "reports"("resolvedByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_resolvedByUserId_fkey'
  ) THEN
    ALTER TABLE "reports"
      ADD CONSTRAINT "reports_resolvedByUserId_fkey"
      FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "site_copy_bundles" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "strings" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_copy_bundles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_copy_bundles_pageKey_language_key" ON "site_copy_bundles"("pageKey", "language");
CREATE INDEX IF NOT EXISTS "site_copy_bundles_language_idx" ON "site_copy_bundles"("language");
