import prisma from '../config/database';
import { generateOtp } from '../utils/response';
import { messageCentralService } from './message-central.service';

const IS_DEV = process.env.NODE_ENV === 'development';

export class AuthService {
  /**
   * Send OTP — uses MSG Central in production, local OTP in dev
   */
  static async sendOtp(phone: string): Promise<{ otp?: string; verificationId?: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Clean up old OTPs for this phone
    await prisma.otpVerification.deleteMany({
      where: { phone, type: 'login' },
    });

    if (IS_DEV) {
      // Dev mode: generate local OTP and return it
      const otp = generateOtp(6);
      await prisma.otpVerification.create({
        data: { phone, otp, type: 'login', expiresAt },
      });
      return { otp, expiresAt };
    }

    // Production: use MSG Central
    const result = await messageCentralService.sendOtp(phone);
    if (!result.success) {
      throw new Error(result.error || 'Failed to send OTP');
    }

    // Store verificationId in OTP table for later validation
    await prisma.otpVerification.create({
      data: {
        phone,
        otp: result.verificationId || 'mc-pending',
        type: 'login',
        expiresAt,
      },
    });

    return { verificationId: result.verificationId, expiresAt };
  }

  /**
   * Validate OTP — uses MSG Central in production, local check in dev
   */
  static async validateOtp(
    phone: string,
    otp: string
  ): Promise<{ isValid: boolean; isNewUser: boolean; otpId?: string; userId?: string }> {
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone,
        type: 'login',
        expiresAt: { gte: new Date() },
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return { isValid: false, isNewUser: false };
    }

    // Lock OTP after 5 failed attempts — force user to request a new one
    if (otpRecord.attempts >= 5) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      return { isValid: false, isNewUser: false };
    }

    if (IS_DEV) {
      // Dev mode: match OTP directly
      if (otpRecord.otp !== otp) {
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });
        return { isValid: false, isNewUser: false };
      }
    } else {
      // Production: validate via MSG Central
      const verificationId = otpRecord.otp; // stored the verificationId here
      const result = await messageCentralService.validateOtp(verificationId, otp);
      if (!result.success) {
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });
        throw new Error(result.error || 'OTP verification failed');
      }
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (user) {
      return { isValid: true, isNewUser: false, otpId: otpRecord.id, userId: user.id };
    }

    return { isValid: true, isNewUser: true, otpId: otpRecord.id };
  }

  static async consumeOtp(otpId: string): Promise<void> {
    await prisma.otpVerification.update({
      where: { id: otpId },
      data: { isUsed: true },
    });
  }

  static async registerUser(
    phone: string,
    name: string,
    username: string,
    dob?: Date
  ): Promise<{ id: string; phone: string | null; username: string; name: string }> {
    return prisma.user.create({
      data: { phone, name, username, dob, isVerified: true },
    });
  }

  static async checkUsernameAvailability(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    return !user;
  }
}
