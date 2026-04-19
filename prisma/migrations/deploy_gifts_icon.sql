-- Optional: run if DB already exists (PostgreSQL)
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS "iconEmoji" TEXT;
ALTER TABLE gifts ALTER COLUMN "imageUrl" DROP NOT NULL;
