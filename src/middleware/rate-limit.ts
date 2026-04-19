import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for OTP sending — max 5 per phone per 15 minutes.
 * Keyed by IP + phone to prevent both per-phone and per-IP abuse.
 */
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const phone = req.body?.phone || 'unknown';
    return `otp-send:${req.ip}:${phone}`;
  },
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for OTP verification — max 5 attempts per phone per 15 minutes.
 * A 6-digit OTP has 1M combinations; 5 attempts gives negligible brute-force probability.
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const phone = req.body?.phone || 'unknown';
    return `otp-verify:${req.ip}:${phone}`;
  },
  message: { success: false, message: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for social auth (Google/Facebook) — max 10 attempts per IP per 15 minutes.
 * Prevents token brute-force and account enumeration.
 */
export const socialAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for webhook endpoints — max 60 per minute per IP.
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many webhook requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for share/view tracking — max 30 per minute per IP.
 */
export const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => `track:${req.ip}:${req.params?.id || 'unknown'}`,
  message: { success: false, message: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for report submission — max 8 reports per 10 minutes per user/IP.
 */
export const reportSubmitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  keyGenerator: (req) => `report:${req.ip}:${(req as any).userId || 'anon'}`,
  message: { success: false, message: 'Too many report submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
