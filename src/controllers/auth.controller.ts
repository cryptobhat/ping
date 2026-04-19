import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { generateToken, AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { generateUsername } from '../utils/response';
import { trackEvent, identifyUser, AnalyticsEvent } from '../services/analytics.service';
import prisma from '../config/database';

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone } = req.body;

    const result = await AuthService.sendOtp(phone);

    successResponse(
      res,
      {
        phone,
        expiresAt: result.expiresAt,
        ...(process.env.NODE_ENV === 'development' ? { otp: result.otp } : {}),
      },
      'OTP sent successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, otp, name, username, dob, referralCode } = req.body;

    const result = await AuthService.validateOtp(phone, otp);

    if (!result.isValid) {
      errorResponse(res, 'Invalid or expired OTP', 400);
      return;
    }

    if (result.isNewUser && !name) {
      successResponse(res, { isNewUser: true }, 'New user verification successful');
      return;
    }

    await AuthService.consumeOtp(result.otpId!);

    let userId: string;
    let isNewUser = false;

    if (result.isNewUser) {
      const finalUsername = username || generateUsername(name, phone);
      const isAvailable = await AuthService.checkUsernameAvailability(finalUsername);
      if (!isAvailable) {
        errorResponse(res, 'Username already taken', 400);
        return;
      }

      const user = await AuthService.registerUser(
        phone,
        name,
        finalUsername.toLowerCase(),
        dob ? new Date(dob) : undefined
      );
      userId = user.id;
      isNewUser = true;

      // Apply referral code if provided
      if (referralCode) {
        const { ReferralService } = await import('../services/referral.service');
        await ReferralService.applyReferralCode(userId, referralCode).catch(() => {});
      }
    } else {
      userId = result.userId!;
    }

    // Fetch user with role and jwtVersion so we can embed them in JWT
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        username: true,
        name: true,
        profileImage: true,
        isPremium: true,
        coinsBalance: true,
        pensBalance: true,
        role: true,
        jwtVersion: true,
      },
    });

    const token = generateToken(userId, user?.role || 'USER', user?.jwtVersion ?? 0);

    // Track login IP/device
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    const device = userAgent.includes('Android') ? 'Android'
      : userAgent.includes('iPhone') ? 'iPhone'
      : userAgent.includes('iPad') ? 'iPad'
      : userAgent.includes('Windows') ? 'Windows'
      : userAgent.includes('Mac') ? 'Mac'
      : userAgent.includes('Linux') ? 'Linux'
      : 'Unknown';

    prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginIp: clientIp,
        lastLoginAt: new Date(),
        lastDevice: device,
        loginCount: { increment: 1 },
      },
    }).catch(() => {}); // Non-blocking

    // Analytics tracking
    if (isNewUser) {
      trackEvent(userId, AnalyticsEvent.USER_SIGNUP, {});
      identifyUser(userId, { name, username: user?.username });
    } else {
      trackEvent(userId, AnalyticsEvent.USER_LOGIN, {});
    }

    successResponse(
      res,
      {
        user: {
          id: user?.id,
          phone: user?.phone,
          username: user?.username,
          name: user?.name,
          profileImage: user?.profileImage,
          isPremium: user?.isPremium,
          coinsBalance: user?.coinsBalance,
          pensBalance: user?.pensBalance,
          role: user?.role,
        },
        token,
        isNewUser,
      },
      isNewUser ? 'Registration successful' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, jwtVersion: true },
    });

    const newToken = generateToken(userId, user?.role || 'USER', user?.jwtVersion ?? 0);

    successResponse(res, { token: newToken }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    // Increment jwtVersion to invalidate all existing tokens
    await prisma.user.update({
      where: { id: userId },
      data: { jwtVersion: { increment: 1 } },
    });

    successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
