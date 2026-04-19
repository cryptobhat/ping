-- Phase 5: Remove narration pipeline tables and audioUrl column
-- Drop in dependency order (children first, then parents)

DROP TABLE IF EXISTS "narration_job_logs" CASCADE;
DROP TABLE IF EXISTS "narration_sfx_assets" CASCADE;
DROP TABLE IF EXISTS "narration_bgm_assets" CASCADE;
DROP TABLE IF EXISTS "narration_audio_assets" CASCADE;
DROP TABLE IF EXISTS "narration_segments" CASCADE;
DROP TABLE IF EXISTS "narration_jobs" CASCADE;
DROP TABLE IF EXISTS "narration_chapters" CASCADE;
DROP TABLE IF EXISTS "narration_stories" CASCADE;
DROP TABLE IF EXISTS "pronunciation_lexicon" CASCADE;

-- Remove narration-related enum types
DROP TYPE IF EXISTS "NarrationJobStatus" CASCADE;
DROP TYPE IF EXISTS "NarrationJobStage" CASCADE;
DROP TYPE IF EXISTS "NarrationSegmentRole" CASCADE;
DROP TYPE IF EXISTS "NarrationSegmentTtsStatus" CASCADE;
DROP TYPE IF EXISTS "NarrationAudioAssetKind" CASCADE;

-- Remove audioUrl column from content table
ALTER TABLE "content" DROP COLUMN IF EXISTS "audioUrl";
