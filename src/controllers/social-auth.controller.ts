import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { generateToken } from '../utils/jwt';
import { successResponse, errorResponse, generateUsername } from '../utils/response';
import { trackEvent, identifyUser, AnalyticsEvent } from '../services/analytics.service';
import prisma from '../config/database';

/**
 * POST /api/v1/auth/google
 * Body: { idToken: string }
 *
 * Verifies a Google ID token, finds or creates a user, and returns a JWT.
 */
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      errorResponse(res, 'idToken is required', 400);
      return;
    }

    // Verify the token with Google
    let googlePayload: {
      sub: string;
      email: string;
      email_verified: string;
      name: string;
      picture?: string;
      aud?: string;
    };

    try {
      const { data } = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );
      googlePayload = data;
    } catch (err: any) {
      errorResponse(res, 'Invalid or expired Google token', 401);
      return;
    }

    const { sub: googleId, email, name, picture } = googlePayload;

    if (!email || !googleId) {
      errorResponse(res, 'Could not retrieve email from Google', 400);
      return;
    }

    // Validate audience (Google Client ID) if configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && googlePayload.aud !== clientId) {
      errorResponse(res, 'Token audience mismatch', 401);
      return;
    }

    // Try to find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
      select: {
        id: true,
        phone: true,
        email: true,
        googleId: true,
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

    let isNewUser = false;

    if (user) {
      // Link googleId if not already linked
      if (!user.googleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId, email, authProvider: 'google' },
        });
      }
      // Update profile image from Google if user has none
      if (!user.profileImage && picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profileImage: picture },
        });
        user.profileImage = picture;
      }
    } else {
      // Create new user
      isNewUser = true;
      const baseUsername = generateUsername(name, undefined);
      let finalUsername = baseUsername.toLowerCase();

      // Ensure username uniqueness
      const existing = await prisma.user.findUnique({ where: { username: finalUsername } });
      if (existing) {
        finalUsername = `${finalUsername}${Math.floor(Math.random() * 9999)}`;
      }

      user = await prisma.user.create({
        data: {
          email,
          googleId,
          authProvider: 'google',
          name: name || 'User',
          username: finalUsername,
          profileImage: picture || null,
          isVerified: true,
        },
        select: {
          id: true,
          phone: true,
          email: true,
          googleId: true,
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
    }

    const token = generateToken(user.id, user.role || 'USER', user.jwtVersion ?? 0);

    // Track login IP/device
    const clientIpGoogle = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
    const userAgentGoogle = req.headers['user-agent'] || '';
    const deviceGoogle = userAgentGoogle.includes('Android') ? 'Android'
      : userAgentGoogle.includes('iPhone') ? 'iPhone'
      : userAgentGoogle.includes('iPad') ? 'iPad'
      : userAgentGoogle.includes('Windows') ? 'Windows'
      : userAgentGoogle.includes('Mac') ? 'Mac'
      : userAgentGoogle.includes('Linux') ? 'Linux'
      : 'Unknown';

    prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginIp: clientIpGoogle,
        lastLoginAt: new Date(),
        lastDevice: deviceGoogle,
        loginCount: { increment: 1 },
      },
    }).catch(() => {}); // Non-blocking

    // Analytics
    if (isNewUser) {
      trackEvent(user.id, AnalyticsEvent.USER_SIGNUP, { provider: 'google' });
      identifyUser(user.id, { name: user.name, username: user.username, email });
    } else {
      trackEvent(user.id, AnalyticsEvent.USER_LOGIN, { provider: 'google' });
    }

    successResponse(
      res,
      {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          username: user.username,
          name: user.name,
          profileImage: user.profileImage,
          isPremium: user.isPremium,
          coinsBalance: user.coinsBalance,
          pensBalance: user.pensBalance,
          role: user.role,
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

/**
 * POST /api/v1/auth/facebook
 * Body: { accessToken: string }
 */
export const facebookAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken } = req.body;
    if (!accessToken || typeof accessToken !== 'string') {
      errorResponse(res, 'accessToken is required', 400);
      return;
    }

    // Verify token with Facebook Graph API
    let fbData: { id: string; name: string; email?: string; picture?: { data?: { url?: string } } };
    try {
      const { data } = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`
      );
      fbData = data;
    } catch {
      errorResponse(res, 'Invalid or expired Facebook token', 401);
      return;
    }

    const { id: facebookId, name, email, picture } = fbData;
    const profileImage = picture?.data?.url || null;

    if (!facebookId) {
      errorResponse(res, 'Could not retrieve data from Facebook', 400);
      return;
    }

    // Find existing user by facebookId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { facebookId },
          ...(email ? [{ email }] : []),
        ],
      },
      select: {
        id: true, phone: true, email: true, facebookId: true, username: true,
        name: true, profileImage: true, isPremium: true, coinsBalance: true,
        pensBalance: true, role: true, jwtVersion: true,
      },
    });

    let isNewUser = false;

    if (user) {
      if (!user.facebookId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { facebookId, ...(email ? { email } : {}), authProvider: 'facebook' },
        });
      }
      if (!user.profileImage && profileImage) {
        await prisma.user.update({ where: { id: user.id }, data: { profileImage } });
        user.profileImage = profileImage;
      }
    } else {
      isNewUser = true;
      const baseUsername = generateUsername(name, undefined);
      let finalUsername = baseUsername.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { username: finalUsername } });
      if (existing) finalUsername = `${finalUsername}${Math.floor(Math.random() * 9999)}`;

      user = await prisma.user.create({
        data: {
          ...(email ? { email } : {}),
          facebookId,
          authProvider: 'facebook',
          name: name || 'User',
          username: finalUsername,
          profileImage,
          isVerified: true,
        },
        select: {
          id: true, phone: true, email: true, facebookId: true, username: true,
          name: true, profileImage: true, isPremium: true, coinsBalance: true,
          pensBalance: true, role: true, jwtVersion: true,
        },
      });
    }

    const token = generateToken(user.id, user.role || 'USER', user.jwtVersion ?? 0);

    // Track login IP/device
    const clientIpFb = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
    const userAgentFb = req.headers['user-agent'] || '';
    const deviceFb = userAgentFb.includes('Android') ? 'Android'
      : userAgentFb.includes('iPhone') ? 'iPhone'
      : userAgentFb.includes('iPad') ? 'iPad'
      : userAgentFb.includes('Windows') ? 'Windows'
      : userAgentFb.includes('Mac') ? 'Mac'
      : userAgentFb.includes('Linux') ? 'Linux'
      : 'Unknown';

    prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginIp: clientIpFb,
        lastLoginAt: new Date(),
        lastDevice: deviceFb,
        loginCount: { increment: 1 },
      },
    }).catch(() => {}); // Non-blocking

    if (isNewUser) {
      trackEvent(user.id, AnalyticsEvent.USER_SIGNUP, { provider: 'facebook' });
      identifyUser(user.id, { name: user.name, username: user.username, email: email || '' });
    } else {
      trackEvent(user.id, AnalyticsEvent.USER_LOGIN, { provider: 'facebook' });
    }

    successResponse(res, {
      user: {
        id: user.id, phone: user.phone, email: user.email,
        username: user.username, name: user.name, profileImage: user.profileImage,
        isPremium: user.isPremium, coinsBalance: user.coinsBalance, pensBalance: user.pensBalance,
        role: user.role,
      },
      token,
      isNewUser,
    }, isNewUser ? 'Registration successful' : 'Login successful');
  } catch (error) {
    next(error);
  }
};
