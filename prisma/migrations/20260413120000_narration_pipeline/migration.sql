-- Narration pipeline (Gemini + Sarvam + ffmpeg)

CREATE TYPE "NarrationJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "NarrationJobStage" AS ENUM ('IDLE', 'GEMINI_PREPROCESS', 'TTS_SEGMENTS', 'FFMPEG_COMPOSE', 'UPLOAD_FINALIZE', 'DONE');
CREATE TYPE "NarrationSegmentRole" AS ENUM ('narration', 'dialogue');
CREATE TYPE "NarrationSegmentTtsStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "NarrationAudioAssetKind" AS ENUM ('SEGMENT_RAW', 'SEGMENT_MASTER', 'CHAPTER_MASTER', 'CHAPTER_DELIVERY', 'WAVEFORM_META');

CREATE TABLE "narration_stories" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "narratorGenderPref" TEXT NOT NULL DEFAULT 'any',
    "dialectColloquial" BOOLEAN NOT NULL DEFAULT true,
    "bgmDefaultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sfxDefaultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narration_stories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "narration_chapters" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT,
    "rawText" TEXT NOT NULL,
    "contentId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narration_chapters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "narration_jobs" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "status" "NarrationJobStatus" NOT NULL DEFAULT 'QUEUED',
    "currentStage" "NarrationJobStage" NOT NULL DEFAULT 'IDLE',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorStage" "NarrationJobStage",
    "geminiJson" JSONB,
    "stageTimingsMs" JSONB NOT NULL DEFAULT '{}',
    "masterAssetId" TEXT,
    "deliveryAssetId" TEXT,
    "waveformMeta" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narration_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "narration_audio_assets" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "kind" "NarrationAudioAssetKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "bitrate" INTEGER,
    "durationMs" INTEGER,
    "checksum" TEXT,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "narration_audio_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "narration_segments" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "segmentIndex" INTEGER NOT NULL,
    "role" "NarrationSegmentRole" NOT NULL,
    "speaker" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "pauseAfterMs" INTEGER NOT NULL DEFAULT 0,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "bgmTag" TEXT NOT NULL,
    "sfxTag" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "normalizedTtsText" TEXT NOT NULL,
    "ttsStatus" "NarrationSegmentTtsStatus" NOT NULL DEFAULT 'PENDING',
    "ttsRetryCount" INTEGER NOT NULL DEFAULT 0,
    "ttsErrorMessage" TEXT,
    "durationMs" INTEGER,
    "idempotencyKey" TEXT,
    "audioAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narration_segments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pronunciation_lexicon" (
    "id" TEXT NOT NULL,
    "rawToken" TEXT NOT NULL,
    "normalizedToken" TEXT NOT NULL,
    "spokenOverride" TEXT,
    "dialect" TEXT NOT NULL DEFAULT 'general',
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pronunciation_lexicon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "narration_bgm_assets" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "defaultGainDb" DOUBLE PRECISION NOT NULL DEFAULT -18,
    "loop" BOOLEAN NOT NULL DEFAULT true,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "narration_bgm_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "narration_sfx_assets" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "defaultGainDb" DOUBLE PRECISION NOT NULL DEFAULT -12,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "narration_sfx_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "narration_job_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "narration_job_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "narration_chapters_storyId_chapterNumber_key" ON "narration_chapters"("storyId", "chapterNumber");
CREATE UNIQUE INDEX "narration_jobs_masterAssetId_key" ON "narration_jobs"("masterAssetId");
CREATE UNIQUE INDEX "narration_jobs_deliveryAssetId_key" ON "narration_jobs"("deliveryAssetId");
CREATE UNIQUE INDEX "narration_segments_idempotencyKey_key" ON "narration_segments"("idempotencyKey");
CREATE UNIQUE INDEX "narration_segments_audioAssetId_key" ON "narration_segments"("audioAssetId");
CREATE UNIQUE INDEX "narration_segments_jobId_segmentIndex_key" ON "narration_segments"("jobId", "segmentIndex");
CREATE UNIQUE INDEX "pronunciation_lexicon_rawToken_dialect_key" ON "pronunciation_lexicon"("rawToken", "dialect");
CREATE UNIQUE INDEX "narration_bgm_assets_tag_key" ON "narration_bgm_assets"("tag");
CREATE UNIQUE INDEX "narration_sfx_assets_tag_key" ON "narration_sfx_assets"("tag");

CREATE INDEX "narration_stories_ownerId_idx" ON "narration_stories"("ownerId");
CREATE INDEX "narration_chapters_contentId_idx" ON "narration_chapters"("contentId");
CREATE INDEX "narration_jobs_chapterId_status_idx" ON "narration_jobs"("chapterId", "status");
CREATE INDEX "narration_jobs_status_createdAt_idx" ON "narration_jobs"("status", "createdAt");
CREATE INDEX "narration_segments_jobId_ttsStatus_idx" ON "narration_segments"("jobId", "ttsStatus");
CREATE INDEX "narration_audio_assets_jobId_kind_idx" ON "narration_audio_assets"("jobId", "kind");
CREATE INDEX "narration_audio_assets_storageKey_idx" ON "narration_audio_assets"("storageKey");
CREATE INDEX "pronunciation_lexicon_rawToken_idx" ON "pronunciation_lexicon"("rawToken");
CREATE INDEX "narration_job_logs_jobId_createdAt_idx" ON "narration_job_logs"("jobId", "createdAt");

ALTER TABLE "narration_stories" ADD CONSTRAINT "narration_stories_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "narration_chapters" ADD CONSTRAINT "narration_chapters_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "narration_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "narration_chapters" ADD CONSTRAINT "narration_chapters_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "narration_jobs" ADD CONSTRAINT "narration_jobs_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "narration_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "narration_audio_assets" ADD CONSTRAINT "narration_audio_assets_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "narration_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "narration_segments" ADD CONSTRAINT "narration_segments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "narration_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "narration_segments" ADD CONSTRAINT "narration_segments_audioAssetId_fkey" FOREIGN KEY ("audioAssetId") REFERENCES "narration_audio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "narration_job_logs" ADD CONSTRAINT "narration_job_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "narration_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "narration_jobs" ADD CONSTRAINT "narration_jobs_masterAssetId_fkey" FOREIGN KEY ("masterAssetId") REFERENCES "narration_audio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "narration_jobs" ADD CONSTRAINT "narration_jobs_deliveryAssetId_fkey" FOREIGN KEY ("deliveryAssetId") REFERENCES "narration_audio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
