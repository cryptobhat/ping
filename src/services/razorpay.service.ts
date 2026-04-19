import Razorpay from 'razorpay';
import crypto from 'crypto';

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let razorpay: Razorpay | null = null;

function getInstance(): Razorpay {
  if (!razorpay) {
    if (!KEY_ID || !KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return razorpay;
}

export const razorpayService = {
  /**
   * Create a Razorpay order for payment
   */
  async createOrder(params: {
    amount: number; // in INR (will be converted to paise)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    const rp = getInstance();
    const order = await rp.orders.create({
      amount: Math.round(params.amount * 100), // Convert to paise
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
    });
    return {
      orderId: order.id,
      amount: params.amount,
      currency: order.currency,
      keyId: KEY_ID,
    };
  },

  /**
   * Fetch the verified order amount from Razorpay (in INR, not paise)
   */
  async getOrderAmount(orderId: string): Promise<number> {
    const rp = getInstance();
    const order = await rp.orders.fetch(orderId);
    return Number(order.amount) / 100; // Convert paise to INR
  },

  /**
   * Verify Razorpay payment signature
   */
  verifyPayment(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(body)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(params.signature, 'hex')
      );
    } catch {
      return false;
    }
  },

  /**
   * Verify webhook signature
   */
  verifyWebhook(body: string, signature: string, secret?: string): boolean {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || KEY_SECRET;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );
    } catch {
      return false;
    }
  },
};
