import { NextFunction, Response } from 'express';
import { LlmService } from '../services/llm.service';
import { StoryTeaserService } from '../services/story-teaser.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

/**
 * POST /api/v1/ai/writing/suggest
 * Body: { text: string, contentType: string, language: string }
 * Returns: { suggestion: string }
 */
export const suggest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, contentType, language } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      errorResponse(res, 'Text must be at least 10 characters', 400);
      return;
    }

    if (!contentType || !['STORY', 'POEM', 'ARTICLE'].includes(contentType)) {
      errorResponse(res, 'Invalid contentType. Must be STORY, POEM, or ARTICLE', 400);
      return;
    }

    const suggestion = await LlmService.suggestWriting(
      text.trim(),
      contentType,
      language || 'kn'
    );

    successResponse(res, { suggestion });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/writing/generate-description
 * Body: { title: string, body: string, contentType: string }
 * Returns: { description: string }
 */
export const generateDescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, body, contentType } = req.body;

    if (!title || !body) {
      errorResponse(res, 'Title and body are required', 400);
      return;
    }

    const description = await LlmService.generateDescription(
      title.trim(),
      body.trim(),
      contentType || 'STORY'
    );

    if (!description) {
      errorResponse(res, 'Could not generate description. Please try again.', 503);
      return;
    }

    successResponse(res, { description });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/writing/story-teaser
 * Body: { contentId: string }
 * Returns: { teaser: string, nextEpisodeId: string | null }
 */
export const storyTeaser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contentId } = req.body;

    if (!contentId || typeof contentId !== 'string') {
      errorResponse(res, 'contentId is required', 400);
      return;
    }

    const teaser = await StoryTeaserService.getTeaser(contentId);
    const nextEpisodeId = await StoryTeaserService.getNextEpisode(contentId);

    if (!teaser) {
      errorResponse(res, 'No teaser available for this content', 404);
      return;
    }

    successResponse(res, { teaser, nextEpisodeId });
  } catch (error) {
    next(error);
  }
};
