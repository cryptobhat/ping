import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10).max(15).regex(/^\+?\d{10,15}$/, 'Phone must contain only digits (optional leading +)'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10).max(15).regex(/^\+?\d{10,15}$/, 'Phone must contain only digits (optional leading +)'),
    otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
    name: z.string().min(2).max(100).optional(),
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric').optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional(),
    referralCode: z.string().min(4).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid referral code').optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    profileImage: z.string().url().optional(),
    visibility: z.enum(['public', 'private', 'followers']).optional(),
  }),
});

export const updateUsernameSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});