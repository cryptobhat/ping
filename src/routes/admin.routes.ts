import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', adminController.getAllUsers);
router.get('/users/duplicate-ips', adminController.getDuplicateIPs);
router.post('/users', adminController.createUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/verify', adminController.verifyUser);

router.get('/content', adminController.getAllContent);
router.put('/content/:id', adminController.updateContent);
router.delete('/content/:id', adminController.deleteContent);
router.put('/content/:id/feature', adminController.featureContent);
router.put('/content/:id/premium', adminController.setPremiumContent);

router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

router.get('/campaigns', adminController.getCampaigns);
router.post('/campaigns', adminController.createCampaign);

router.get('/ads', adminController.getAdConfigs);
router.put('/ads/:id', adminController.updateAdConfig);

router.get('/pricing', adminController.getPricing);
router.post('/pricing/subscriptions', adminController.createSubscriptionPlan);
router.put('/pricing/subscriptions', adminController.updatePricing);
router.put('/pricing/subscriptions/:id', adminController.updateSubscriptionPlan);
router.delete('/pricing/subscriptions/:id', adminController.deleteSubscriptionPlan);
router.put('/pricing/subscriptions/:id/toggle', adminController.toggleSubscriptionPlan);

router.get('/analytics/overview', adminController.getAnalytics);

router.get('/site-copy', adminController.listSiteCopy);
router.put('/site-copy', adminController.upsertSiteCopy);

router.get('/gifts', adminController.listGiftsAdmin);
router.post('/gifts', adminController.createGiftAdmin);
router.put('/gifts/:id', adminController.updateGiftAdmin);
router.delete('/gifts/:id', adminController.deleteGiftAdmin);

// Payout management
router.get('/payouts', adminController.getPendingPayouts);
router.get('/payouts/stats', adminController.getPayoutStats);
router.post('/payouts/:id/action', adminController.processPayoutAction);

// Platform settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Creator eligibility management
router.put('/users/:id/creator-eligibility', adminController.setCreatorEligibility);

// Daily writing topic
router.get('/daily-topic', adminController.getDailyTopic);
router.put('/daily-topic', adminController.setDailyTopic);

// Notifications
router.post('/notifications/broadcast', adminController.adminSendNotification);
router.post('/notifications/interest', adminController.adminNotifyByInterest);

// Language config
router.get('/languages', adminController.getEnabledLanguages);
router.put('/languages', adminController.setEnabledLanguages);

// Banners
router.get('/banners', adminController.getAllBanners);
router.post('/banners', adminController.createBanner);
router.put('/banners/:id', adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);

export default router;
