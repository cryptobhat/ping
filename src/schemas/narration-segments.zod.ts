import { z } from 'zod';

export const NARRATION_EMOTIONS = [
  'calm',
  'suspense',
  'sad',
  'happy',
  'anger',
  'devotional',
] as const;

export const NARRATION_BGM_TAGS = [
  'none',
  'calm_pad',
  'tension_drone',
  'soft_emotion',
  'devotional_tanpura',
  'light_playful',
] as const;

export const NARRATION_SFX_TAGS = [
  'none',
  'footsteps',
  'door_open',
  'thunder',
  'wind',
  'gasp',
  'temple_bell',
] as const;

export const narrationSegmentSchema = z.object({
  segment_id: z.number().int().positive(),
  role: z.enum(['narration', 'dialogue']),
  speaker: z.string().min(1).max(200),
  emotion: z.enum(NARRATION_EMOTIONS),
  pause_after_ms: z.number().int().min(0).max(10000),
  speed: z.number().min(0.85).max(1.15),
  bgm_tag: z.enum(NARRATION_BGM_TAGS),
  sfx_tag: z.enum(NARRATION_SFX_TAGS),
  original_text: z.string().min(1),
  normalized_tts_text: z.string().min(1),
});

export const narrationPreprocessOutputSchema = z.object({
  segments: z.array(narrationSegmentSchema).min(1).max(500),
});

export type NarrationPreprocessOutput = z.infer<typeof narrationPreprocessOutputSchema>;
export type NarrationSegmentJson = z.infer<typeof narrationSegmentSchema>;
