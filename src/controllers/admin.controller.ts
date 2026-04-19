import { NextFunction, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { NotificationService } from '../services/notification.service';
import { SiteCopyService } from '../services/site-copy.service';
import { AdminGiftService } from '../services/admin-gift.service';
import { CreatorSubscriptionService } from '../services/creator-subscription.service';
import { BannerService } from '../services/banner.service';
import prisma from '../config/database';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';


export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const search = ((req.query.search as string) || '').trim().slice(0, 100) || undefined;

    const { users, total } = await AdminService.getAllUsers(page, limit, search);
    paginatedResponse(res, users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, name, username } = req.body;
    const user = await AdminService.createUser({ phone, name, username });
    successResponse(res, user, 'User created', 201);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteUser(id);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'User not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await AdminService.updateUser(id, req.body);
    successResponse(res, user, "User updated");
  } catch (error: any) {
    if (error.message === "User not found") {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const updateContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const content = await AdminService.updateContent(id, req.body);
    successResponse(res, content, "Content updated");
  } catch (error: any) {
    if (error.message === "Content not found") {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const verifyUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    if (typeof isVerified !== 'boolean') {
      errorResponse(res, 'isVerified (boolean) is required', 400);
      return;
    }
    const user = await AdminService.setUserVerified(id, isVerified);
    successResponse(res, user, isVerified ? 'User verified' : 'User unverified');
  } catch (error: any) {
    if (error.message === 'User not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const getAllContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const contentType = req.query.contentType as string;
    const authorId = req.query.authorId as string;

    const { content, total } = await AdminService.getAllContent(page, limit, { contentType, authorId });
    paginatedResponse(res, content, page, limit, total);
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
    const { id } = req.params;
    const result = await AdminService.deleteContent(id);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const featureContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    const content = await AdminService.featureContent(id, featured);
    successResponse(res, content);
  } catch (error) {
    next(error);
  }
};

export const setPremiumContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPremium } = req.body;
    if (typeof isPremium !== 'boolean') {
      errorResponse(res, 'isPremium (boolean) is required', 400);
      return;
    }
    const content = await AdminService.setPremiumContent(id, isPremium);
    successResponse(res, content, isPremium ? 'Content marked as premium' : 'Content marked as free');
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: { children: true },
    });
    successResponse(res, categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const category = await AdminService.createCategory(req.body);
    successResponse(res, category, 'Category created', 201);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await AdminService.updateCategory(id, req.body);
    successResponse(res, category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteCategory(id);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getCampaigns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const { campaigns, total } = await AdminService.getAllCampaigns(page, limit);
    paginatedResponse(res, campaigns, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.userId!;
    const campaign = await AdminService.createCampaign(req.body, adminId);
    successResponse(res, campaign, 'Campaign created', 201);
  } catch (error) {
    next(error);
  }
};

export const getAdConfigs = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const configs = await AdminService.getAdConfigs();
    successResponse(res, configs);
  } catch (error) {
    next(error);
  }
};

export const updateAdConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const config = await AdminService.updateAdConfig(id, req.body, adminId);
    successResponse(res, config);
  } catch (error) {
    next(error);
  }
};

export const getPricing = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pricing = await AdminService.getPricing();
    successResponse(res, pricing);
  } catch (error) {
    next(error);
  }
};

export const updatePricing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { planId, price } = req.body;
    const result = await AdminService.updateSubscriptionPlanPrice(planId, price);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const createSubscriptionPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, price, durationDays, isActive } = req.body;
    if (!name || price == null || !durationDays) {
      res.status(400).json({ success: false, message: 'name, price and durationDays are required' });
      return;
    }
    const result = await AdminService.createSubscriptionPlan({
      name,
      description: description || null,
      price: Number(price),
      durationDays: Number(durationDays),
      isActive: isActive !== false,
    });
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await AdminService.updateSubscriptionPlan(id, req.body);
    successResponse(res, result, 'Plan updated');
  } catch (error: any) {
    if (error.message === 'Plan not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const deleteSubscriptionPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteSubscriptionPlan(id);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'Plan not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    if (error.message.includes('Cannot delete')) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const toggleSubscriptionPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await AdminService.toggleSubscriptionPlan(id);
    successResponse(res, result, result.isActive ? 'Plan activated' : 'Plan deactivated');
  } catch (error: any) {
    if (error.message === 'Plan not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const getDuplicateIPs = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const duplicates = await AdminService.getDuplicateIPs();
    successResponse(res, duplicates);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await AdminService.getAnalytics();
    successResponse(res, analytics);
  } catch (error) {
    next(error);
  }
};

export const listSiteCopy = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bundles = await SiteCopyService.listBundles();
    successResponse(res, { bundles, defaultPageKeys: SiteCopyService.listPageKeys() });
  } catch (error) {
    next(error);
  }
};

export const listGiftsAdmin = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const gifts = await AdminGiftService.listAll();
    successResponse(res, gifts);
  } catch (error) {
    next(error);
  }
};

export const createGiftAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const row = await AdminGiftService.create(req.body);
    successResponse(res, row, 'Gift created', 201);
  } catch (error: any) {
    if (error?.message) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const updateGiftAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const row = await AdminGiftService.update(id, req.body);
    successResponse(res, row, 'Gift updated');
  } catch (error: any) {
    if (error.message === 'Gift not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    if (error?.message) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const deleteGiftAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await AdminGiftService.delete(id);
    successResponse(res, null, 'Gift deleted');
  } catch (error: any) {
    if (error.message === 'Gift not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

// ==========================================
// Payout Management
// ==========================================

export const getPendingPayouts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const status = (req.query.status as string) || 'pending';
    const skip = (page - 1) * limit;

    const where = {
      type: 'WITHDRAWAL',
      ...(status !== 'all' && { status }),
    };

    const [payouts, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, username: true, phone: true },
          },
        },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    const formatted = payouts.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      userUsername: p.user.username,
      userPhone: p.user.phone,
      amount: Number(p.amount),
      upiId: p.referenceId,
      description: p.description,
      status: p.status,
      createdAt: p.createdAt,
    }));

    paginatedResponse(res, formatted, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const processPayoutAction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      errorResponse(res, 'Action must be "approve" or "reject"', 400);
      return;
    }

    const payout = await prisma.walletTransaction.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, coinsBalance: true } } },
    });

    if (!payout) {
      errorResponse(res, 'Payout not found', 404);
      return;
    }

    if (payout.type !== 'WITHDRAWAL') {
      errorResponse(res, 'Transaction is not a withdrawal', 400);
      return;
    }

    if (payout.status !== 'pending') {
      errorResponse(res, `Payout already ${payout.status}`, 400);
      return;
    }

    if (action === 'approve') {
      // Mark as completed — admin has manually transferred via UPI
      await prisma.$transaction(async (tx) => {
        await tx.walletTransaction.update({
          where: { id },
          data: { status: 'completed' },
        });

        // Notify the writer
        await tx.notification.create({
          data: {
            userId: payout.userId,
            type: 'PAYOUT_COMPLETED',
            title: 'Withdrawal Successful',
            body: `₹${Number(payout.amount)} has been transferred to your UPI (${payout.referenceId}).`,
            data: { payoutId: id, amount: Number(payout.amount) },
          },
        });
      });

      successResponse(res, { id, status: 'completed' }, 'Payout approved and marked as completed');
    } else {
      // Reject — refund the coins back to the writer
      // Parse the original gross amount from description (format: "Withdrawal of ₹{gross} (fee: ₹{fee}) to UPI: {upiId}")
      const grossMatch = payout.description?.match(/Withdrawal of ₹(\d+)/);
      const grossAmount = grossMatch ? parseInt(grossMatch[1]) : Number(payout.amount);

      await prisma.$transaction(async (tx) => {
        await tx.walletTransaction.update({
          where: { id },
          data: { status: 'rejected' },
        });

        // Refund coins (1 coin = ₹1)
        await tx.user.update({
          where: { id: payout.userId },
          data: { coinsBalance: { increment: grossAmount } },
        });

        // Create refund transaction record
        await tx.walletTransaction.create({
          data: {
            userId: payout.userId,
            type: 'REFUND',
            amount: grossAmount,
            balance: 0,
            description: `Refund: withdrawal rejected${rejectionReason ? ` — ${rejectionReason}` : ''}`,
            referenceId: id,
            referenceType: 'payout_refund',
            status: 'completed',
          },
        });

        // Notify the writer
        await tx.notification.create({
          data: {
            userId: payout.userId,
            type: 'PAYOUT_REJECTED',
            title: 'Withdrawal Rejected',
            body: rejectionReason
              ? `Your withdrawal of ₹${grossAmount} was rejected: ${rejectionReason}. Coins have been refunded.`
              : `Your withdrawal of ₹${grossAmount} was rejected. Coins have been refunded.`,
            data: { payoutId: id, amount: grossAmount, reason: rejectionReason },
          },
        });
      });

      successResponse(res, { id, status: 'rejected', refunded: grossAmount }, 'Payout rejected, coins refunded');
    }
  } catch (error) {
    next(error);
  }
};

export const getPayoutStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [pending, completed, rejected, totalPaid] = await Promise.all([
      prisma.walletTransaction.count({ where: { type: 'WITHDRAWAL', status: 'pending' } }),
      prisma.walletTransaction.count({ where: { type: 'WITHDRAWAL', status: 'completed' } }),
      prisma.walletTransaction.count({ where: { type: 'WITHDRAWAL', status: 'rejected' } }),
      prisma.walletTransaction.aggregate({
        where: { type: 'WITHDRAWAL', status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    successResponse(res, {
      pending,
      completed,
      rejected,
      totalPaidINR: Number(totalPaid._sum.amount ?? 0),
    });
  } catch (error) {
    next(error);
  }
};

export const upsertSiteCopy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { pageKey, language, strings } = req.body;
    if (!pageKey || !language) {
      errorResponse(res, 'pageKey and language are required', 400);
      return;
    }
    const row = await SiteCopyService.upsertBundle(String(pageKey), String(language), strings || {});
    successResponse(res, row, 'Site copy saved');
  } catch (error: any) {
    if (error?.message) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

// ==========================================
// Platform Settings
// ==========================================

export const getSettings = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await AdminService.getSettings();
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await AdminService.updateSettings(req.body);
    successResponse(res, result, 'Settings updated');
  } catch (error: any) {
    if (error?.message) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

// ==========================================
// Daily Writing Topic
// ==========================================

export const setDailyTopic = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topic, topicKn, description, date } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      errorResponse(res, 'topic (string) is required', 400);
      return;
    }
    const result = await AdminService.setDailyTopic({ topic: topic.trim(), topicKn, description, date });
    successResponse(res, result, 'Daily topic updated');
  } catch (error) {
    next(error);
  }
};

export const getDailyTopic = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const topic = await AdminService.getDailyTopic();
    successResponse(res, topic);
  } catch (error) {
    next(error);
  }
};

export const setCreatorEligibility = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isCreatorEligible } = req.body;

    if (typeof isCreatorEligible !== 'boolean') {
      errorResponse(res, 'isCreatorEligible (boolean) is required', 400);
      return;
    }

    const result = await CreatorSubscriptionService.adminSetEligibility(id, isCreatorEligible);
    successResponse(res, result, isCreatorEligible ? 'Creator eligibility enabled' : 'Creator eligibility disabled');
  } catch (error: any) {
    if (error.message === 'User not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

// ==========================================
// Admin Notifications
// ==========================================

export const adminSendNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, body, targetType, type, data } = req.body;
    if (!title || !body) {
      errorResponse(res, 'title and body are required', 400);
      return;
    }
    const result = await NotificationService.adminBroadcast({
      title,
      body,
      type,
      targetType: targetType || 'all',
      data,
    });
    successResponse(res, result, `Notification sent to ${result.sent} users`);
  } catch (error) {
    next(error);
  }
};

export const adminNotifyByInterest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contentId } = req.body;
    if (!contentId) {
      errorResponse(res, 'contentId is required', 400);
      return;
    }
    const result = await NotificationService.notifyByInterest(contentId);
    successResponse(res, result, `Interest-based notification sent`);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Banners
// ==========================================

export const getAllBanners = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const banners = await BannerService.getAll();
    successResponse(res, banners);
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    const banner = await BannerService.create(data);
    successResponse(res, banner, 'Banner created', 201);
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    const banner = await BannerService.update(id, data);
    successResponse(res, banner, 'Banner updated');
  } catch (error: any) {
    if (error.message === 'Banner not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

// ==========================================
// Language Config
// ==========================================

export const getEnabledLanguages = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const languages = await AdminService.getEnabledLanguages();
    successResponse(res, languages);
  } catch (error) {
    next(error);
  }
};

export const setEnabledLanguages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { languages } = req.body;
    if (!Array.isArray(languages) || languages.length === 0) {
      errorResponse(res, 'languages array is required', 400);
      return;
    }
    const result = await AdminService.setEnabledLanguages(languages);
    successResponse(res, result, 'Languages updated');
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await BannerService.delete(id);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'Banner not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};
// ==========================================
// Trending Override
// ==========================================

export const pinTrending = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contentId } = req.params;
    const { position, timeWindow } = req.body;
    const tw = timeWindow || 'daily';
    const pos = position || 1;

    const content = await prisma.content.findUnique({ where: { id: contentId }, select: { id: true } });
    if (!content) {
      errorResponse(res, 'Content not found', 404);
      return;
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const entry = await prisma.trendingContent.upsert({
      where: { contentId_timeWindow: { contentId, timeWindow: tw } },
      create: {
        contentId,
        trendingScore: 999999,
        viewVelocity: 0,
        engagementRate: 0,
        recencyFactor: 1,
        timeWindow: tw,
        rankPosition: pos,
        expiresAt,
      },
      update: {
        trendingScore: 999999,
        rankPosition: pos,
        expiresAt,
        calculatedAt: new Date(),
      },
    });

    successResponse(res, entry, 'Content pinned to trending');
  } catch (error) {
    next(error);
  }
};

export const unpinTrending = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contentId } = req.params;
    const timeWindow = (req.query.timeWindow as string) || 'daily';

    await prisma.trendingContent.deleteMany({
      where: { contentId, timeWindow },
    });

    successResponse(res, null, 'Content unpinned from trending');
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Hashtag Management
// ==========================================

export const listHashtags = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [hashtags, total] = await Promise.all([
      prisma.hashtag.findMany({
        orderBy: { count: 'desc' },
        skip,
        take: limit,
      }),
      prisma.hashtag.count(),
    ]);

    paginatedResponse(res, hashtags, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const deleteHashtag = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const hashtag = await prisma.hashtag.findUnique({ where: { id } });
    if (!hashtag) {
      errorResponse(res, 'Hashtag not found', 404);
      return;
    }

    // Delete all content links first, then the hashtag
    await prisma.$transaction([
      prisma.contentHashtag.deleteMany({ where: { hashtagId: id } }),
      prisma.hashtag.delete({ where: { id } }),
    ]);

    successResponse(res, null, 'Hashtag deleted');
  } catch (error) {
    next(error);
  }
};

export const featureHashtag = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isTrending } = req.body;

    const hashtag = await prisma.hashtag.findUnique({ where: { id } });
    if (!hashtag) {
      errorResponse(res, 'Hashtag not found', 404);
      return;
    }

    const updated = await prisma.hashtag.update({
      where: { id },
      data: { isTrending: typeof isTrending === 'boolean' ? isTrending : !hashtag.isTrending },
    });

    successResponse(res, updated, updated.isTrending ? 'Hashtag featured' : 'Hashtag unfeatured');
  } catch (error) {
    next(error);
  }
};
