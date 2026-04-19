import { NextFunction, Request, Response } from 'express';
import { ContentService } from '../services/content.service';
import { ContentUnlockService } from '../services/content-unlock.service';
import { razorpayService } from '../services/razorpay.service';
import prismaDb from '../config/database';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse, paginatedResponse, clampLimit } from '../utils/response';
import { trackEvent, AnalyticsEvent } from '../services/analytics.service';
import { enrichContentWithAI } from '../services/ai-enrichment.service';

export const getDailyTopic = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const keys = ['daily_topic', 'daily_topic_kn', 'daily_topic_description', 'daily_topic_date'];
    const rows = await prismaDb.siteConfig.findMany({
      where: { key: { in: keys } },
    });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    successResponse(res, {
      topic: map.daily_topic || '',
      topicKn: map.daily_topic_kn || '',
      description: map.daily_topic_description || '',
      date: map.daily_topic_date || '',
    });
  } catch (error) {
    next(error);
  }
};

export const createContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, body, contentType, categoryId, visibility, coverImage, description, images, isDraft, language, membersOnly, unlockPrice } = req.body;
    // NOTE: isPremium intentionally omitted — only admins can set premium status

    const content = await ContentService.createContent(userId, {
      title,
      body,
      contentType,
      categoryId,
      visibility: visibility || 'PUBLIC',
      isPremium: false,
      membersOnly: membersOnly || false,
      coverImage,
      description,
      images: images || [],
      isDraft: isDraft || false,
      language: language || 'kn',
      unlockPrice: unlockPrice != null ? Number(unlockPrice) : undefined,
    });

    trackEvent(userId, AnalyticsEvent.CONTENT_CREATED, {
      contentId: content.id,
      contentType,
      language: language || 'kn',
      isDraft: isDraft || false,
    });

    // Fire-and-forget: AI enrichment (auto-description + auto-tags) for published content
    if (!isDraft && content.id) {
      enrichContentWithAI(content.id, title, body, contentType, description).catch((err) => {
        console.error('[AI Enrichment] Error:', err.message);
      });
    }

    successResponse(res, content, 'Content created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    const content = await ContentService.getContentById(id, currentUserId);

    if (!content) {
      errorResponse(res, 'Content not found', 404);
      return;
    }

    successResponse(res, content);
  } catch (error) {
    next(error);
  }
};

export const updateContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, body, categoryId, visibility, coverImage, description, images, isDraft, language, membersOnly, unlockPrice } = req.body;
    // NOTE: isPremium intentionally omitted — only admins can set premium status

    const content = await ContentService.updateContent(id, userId, {
      title,
      body,
      categoryId,
      visibility,
      coverImage,
      description,
      images,
      isDraft,
      language,
      membersOnly,
      unlockPrice: unlockPrice != null ? Number(unlockPrice) : undefined,
    });

    if (!content) {
      errorResponse(res, 'Content not found or unauthorized', 404);
      return;
    }

    successResponse(res, content, 'Content updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const deleted = await ContentService.deleteContent(id, userId);

    if (!deleted) {
      errorResponse(res, 'Content not found or unauthorized', 404);
      return;
    }

    successResponse(res, null, 'Content deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const contentType = req.query.contentType as any;
    const categoryId = req.query.categoryId as string;
    const authorId = req.query.authorId as string;
    const search = req.query.search as string;
    const language = req.query.language as string;
    const sort = req.query.sort as 'latest' | 'popular' | 'top_rated' | undefined;
    const currentUserId = req.userId;

    const { content, total } = await ContentService.getFeed(
      page,
      limit,
      { contentType, categoryId, authorId, search, language, sort },
      currentUserId
    );

    paginatedResponse(res, content, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const toggleLike = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await ContentService.toggleLike(id, userId);

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const trackShare = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await ContentService.trackShare(id);

    successResponse(res, null, 'Share tracked');
  } catch (error) {
    next(error);
  }
};

export const getDrafts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { content, total } = await ContentService.getDrafts(userId, page, limit);

    paginatedResponse(res, content, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getSupporters = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const supporters = await ContentService.getSupporters(id);

    successResponse(res, supporters);
  } catch (error) {
    next(error);
  }
};

export const unlockContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await ContentUnlockService.unlock(userId, id);
    successResponse(res, result, 'Content unlocked!');
  } catch (error: any) {
    if (
      error.message.includes('Insufficient') ||
      error.message === 'This content is free' ||
      error.message === 'Already unlocked' ||
      error.message.includes('author')
    ) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

/**
 * POST /api/v1/content/:id/unlock-pay
 * Create a Razorpay order for content unlock (INR payment alternative to coins).
 * Price = unlockPrice / 10 INR (e.g. 50 coins = Rs 5)
 */
export const unlockContentPay = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const content = await prismaDb.content.findUnique({
      where: { id },
      select: { id: true, authorId: true, unlockPrice: true, title: true },
    });

    if (!content) {
      errorResponse(res, 'Content not found', 404);
      return;
    }
    if (!content.unlockPrice || content.unlockPrice <= 0) {
      errorResponse(res, 'This content is free', 400);
      return;
    }
    if (content.authorId === userId) {
      errorResponse(res, 'You are the author — no unlock needed', 400);
      return;
    }

    // Check if already unlocked
    const existing = await prismaDb.contentUnlock.findUnique({
      where: { userId_contentId: { userId, contentId: id } },
    });
    if (existing) {
      errorResponse(res, 'Already unlocked', 400);
      return;
    }

    // Price: unlockPrice / 10 INR (min Rs 1)
    const amountINR = Math.max(1, Math.ceil(content.unlockPrice / 10));

    const order = await razorpayService.createOrder({
      amount: amountINR,
      receipt: `unlock_${id}_${userId}_${Date.now()}`,
      notes: {
        userId,
        contentId: id,
        type: 'content_unlock',
      },
    });

    successResponse(res, order, 'Order created');
  } catch (err: any) {
    errorResponse(res, err.message || 'Failed to create unlock order', 500);
  }
};

/**
 * POST /api/v1/content/:id/unlock-pay/verify
 * Verify Razorpay payment and create ContentUnlock record.
 * Body: { orderId, paymentId, signature }
 */
export const verifyUnlockPay = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      errorResponse(res, 'Missing payment fields', 400);
      return;
    }

    // Verify signature
    const isValid = razorpayService.verifyPayment({ orderId, paymentId, signature });
    if (!isValid) {
      errorResponse(res, 'Payment verification failed', 400);
      return;
    }

    // Idempotency check
    const existing = await prismaDb.contentUnlock.findUnique({
      where: { userId_contentId: { userId, contentId: id } },
    });
    if (existing) {
      successResponse(res, { unlocked: true, duplicate: true }, 'Already unlocked');
      return;
    }

    const content = await prismaDb.content.findUnique({
      where: { id },
      select: { id: true, authorId: true, unlockPrice: true, title: true },
    });

    if (!content || !content.unlockPrice) {
      errorResponse(res, 'Content not found or is free', 400);
      return;
    }

    // Fetch verified amount from Razorpay
    const orderAmount = await razorpayService.getOrderAmount(orderId);

    // Credit author wallet, create unlock record
    await prismaDb.$transaction(async (tx) => {
      // Platform keeps 20%, author gets 80%
      const authorCredit = orderAmount * 0.8;

      await tx.user.update({
        where: { id: content.authorId },
        data: { walletBalance: { increment: authorCredit } },
      });

      await tx.contentUnlock.create({
        data: {
          userId,
          contentId: id,
          coinsSpent: 0, // paid via INR, not coins
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: content.authorId,
          type: 'REWARD',
          amount: authorCredit,
          balance: 0,
          description: `Episode unlock (Razorpay): ${content.title || 'content'} (20% platform fee)`,
          referenceId: paymentId,
          referenceType: 'content_unlock_razorpay',
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount: Number(orderAmount),
          referenceId: paymentId,
          referenceType: 'razorpay',
          status: 'COMPLETED',
          metadata: { contentId: id, type: 'content_unlock' },
        },
      });
    });

    successResponse(res, { unlocked: true }, 'Content unlocked via payment!');
  } catch (err: any) {
    errorResponse(res, err.message || 'Payment processing failed', 500);
  }
};