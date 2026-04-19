import { ContentType } from '@prisma/client';

/**
 * Listen / TTS / narration pipeline applies only to **stories** (including serialized
 * series episodes, which are stored as `ContentType.STORY`). Poems, articles, and quotes
 * are excluded.
 */
export function isNarrationEligibleContentType(contentType: ContentType): boolean {
  return contentType === ContentType.STORY;
}
