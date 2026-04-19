import dotenv from 'dotenv';
dotenv.config();

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret === 'your-secret-key') {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be set in production (min 32 chars)');
        }
        console.warn('[SECURITY WARNING] Using default JWT_SECRET - set JWT_SECRET env var for production');
        return 'dev-only-insecure-jwt-secret-do-not-use-in-production';
      }
      return secret;
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  gift: {
    penToInr: parseInt(process.env.PEN_TO_INR || '40', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  easebuzz: {
    key: process.env.EASEBUZZ_KEY || '',
    salt: process.env.EASEBUZZ_SALT || '',
    env: process.env.EASEBUZZ_ENV || 'test',
  },
  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID || '',
    saltKey: process.env.PHONEPE_SALT_KEY || '',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    env: process.env.PHONEPE_ENV || 'UAT',
  },
  zoho: {
    orgId: process.env.ZOHO_ORG_ID || '',
    clientId: process.env.ZOHO_CLIENT_ID || '',
    clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
  },
  paymentRouting: {
    enabled: process.env.SMART_ROUTING_ENABLED === 'true',
    defaultGateway: process.env.DEFAULT_GATEWAY || 'razorpay',
    explorationRate: parseFloat(process.env.ROUTING_EXPLORATION_RATE || '0.2'),
  },
};