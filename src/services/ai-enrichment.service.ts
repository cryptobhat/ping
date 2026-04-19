import prisma from '../config/database';
import { LlmService } from './llm.service';
import { HashtagService } from './hashtag.service';

/**
 * Fire-and-forget AI enrichment for newly created content.
 * Runs ASYNC after content is created — never blocks the create response.
 *
 * 1. Auto-generates description if author didn't provide one
 * 2. Auto-generates hashtags/tags
 */
export async function enrichContentWithAI(
  contentId: string,
  title: string,
  body: string,
  contentType: string,
  existingDescription?: string
): Promise<void> {
  // Run description and tags generation in parallel
  const tasks: Promise<void>[] = [];

  // Task 1: Auto-generate description if empty
  if (!existingDescription?.trim()) {
    tasks.push(generateAndSaveDescription(contentId, title, body, contentType));
  }

  // Task 2: Auto-generate hashtags
  tasks.push(generateAndSaveTags(contentId, title, body, contentType));

  await Promise.allSettled(tasks);
}

async function generateAndSaveDescription(
  contentId: string,
  title: string,
  body: string,
  contentType: string
): Promise<void> {
  try {
    const description = await LlmService.generateDescription(title, body, contentType);
    if (description) {
      await prisma.content.update({
        where: { id: contentId },
        data: { description },
      });
      console.log(`[AI Enrichment] Generated description for content ${contentId}`);
    }
  } catch (err: any) {
    console.error(`[AI Enrichment] Failed to generate description for ${contentId}:`, err.message);
  }
}

async function generateAndSaveTags(
  contentId: string,
  title: string,
  body: string,
  contentType: string
): Promise<void> {
  try {
    const tags = await LlmService.generateTags(title, body, contentType);
    if (tags.length > 0) {
      await HashtagService.linkHashtags(contentId, tags);
      console.log(`[AI Enrichment] Generated ${tags.length} tags for content ${contentId}: ${tags.join(', ')}`);
    }
  } catch (err: any) {
    console.error(`[AI Enrichment] Failed to generate tags for ${contentId}:`, err.message);
  }
}
