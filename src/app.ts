import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import prisma from './config/database';

dotenv.config();

// Fail fast if NODE_ENV is not explicitly set in production-like environments
if (!process.env.NODE_ENV) {
  console.warn('[WARNING] NODE_ENV is not set — defaulting to "development". Set NODE_ENV=production in production.');
}

const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();

// Behind reverse proxy (Railway, Render, Nginx) — required for accurate rate-limit IPs
if (IS_PROD || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging — dev format in dev, combined in production
if (IS_PROD) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

const globalMax = parseInt(process.env.RATE_LIMIT_MAX || '', 10);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.isFinite(globalMax) && globalMax > 0 ? globalMax : IS_PROD ? 600 : 2000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Android App Links verification
app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.digiyogi.kalaloka',
      sha256_cert_fingerprints: [
        // Debug key — replace with release key fingerprint before Play Store
        'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C'
      ],
    },
  }]);
});

// Health check with DB ping
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import contentRoutes from './routes/content.routes';
import categoryRoutes from './routes/category.routes';
import coinRoutes from './routes/coin.routes';
import giftRoutes from './routes/gift.routes';
import supportRoutes from './routes/support.routes';
import subscriptionRoutes from './routes/subscription.routes';
import chatRoutes from './routes/chat.routes';
import followRoutes from './routes/follow.routes';
import adminRoutes from './routes/admin.routes';
import deepLinkRoutes from './routes/deeplink.routes';
import readingRoutes from './routes/reading.routes';
import trendingRoutes from './routes/trending.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notification.routes';
import webhookRoutes from './routes/webhook.routes';
import commentRoutes from './routes/comment.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import favoriteRoutes from './routes/favorite.routes';
import ratingRoutes from './routes/rating.routes';
import walletRoutes from './routes/wallet.routes';
import languageRoutes from './routes/language.routes';
import hashtagRoutes from './routes/hashtag.routes';
import uploadRoutes from './routes/upload.routes';
import seriesRoutes from './routes/series.routes';
import paymentRoutes from './routes/payment.routes';
import payoutRoutes from './routes/payout.routes';
import competitionRoutes from './routes/competition.routes';
import rewardsRoutes from './routes/rewards.routes';
import readingGoalsRoutes from './routes/reading-goals.routes';
import reportRoutes from './routes/report.routes';
import referralRoutes from './routes/referral.routes';
import siteCopyRoutes from './routes/site-copy.routes';
import creatorRoutes from './routes/creator.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import feedRoutes from './routes/feed.routes';
import aiWritingRoutes from './routes/ai-writing.routes';
import liveRoomRoutes from './routes/live-room.routes';
import bannerRoutes from './routes/banner.routes';

// Public config endpoints (no auth required)
app.get('/api/v1/config/languages', async (_req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: 'enabled_languages' } });
    const languages = config ? JSON.parse(config.value) : ['kn', 'hi'];
    res.json({ success: true, data: languages });
  } catch {
    res.json({ success: true, data: ['kn', 'hi'] });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/coins', coinRoutes);
app.use('/api/v1/gifts', giftRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/follow', followRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/deeplink', deepLinkRoutes);
app.use('/api/v1/reading', readingRoutes);
app.use('/api/v1/trending', trendingRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/languages', languageRoutes);
app.use('/api/v1/hashtags', hashtagRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/series', seriesRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/payout', payoutRoutes);
app.use('/api/v1/competitions', competitionRoutes);
app.use('/api/v1/reading/goals', readingGoalsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/site-copy', siteCopyRoutes);
app.use('/api/v1/rewards', rewardsRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/creator', creatorRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/ai/writing', aiWritingRoutes);
app.use('/api/v1/live', liveRoomRoutes);
app.use('/api/v1/banners', bannerRoutes);

// Sentry must be set up before the error handler to capture errors
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

interface CustomError extends Error {
  status?: number;
}

app.use((err: CustomError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(`[ERROR] ${err.message}`, IS_PROD ? '' : err.stack);
  }

  res.status(status).json({
    error: IS_PROD ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    ...(!IS_PROD && { stack: err.stack }),
  });
});

export default app;
