import crypto from 'crypto';
import {
  PaymentGateway, GatewayName, CreateOrderInput, CreateOrderResult,
  VerifyPaymentInput, VerifyPaymentResult, WebhookParseResult,
} from './gateway.interface';

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const ENV = process.env.PHONEPE_ENV || 'UAT';

const BASE_URL = ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export class PhonePeAdapter implements PaymentGateway {
  name: GatewayName = 'phonepe';

  isEnabled(): boolean {
    return !!(MERCHANT_ID && SALT_KEY);
  }

  async isHealthy(): Promise<boolean> {
    return this.isEnabled();
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const merchantTransactionId = input.receipt;
    const callbackUrl = `${process.env.APP_URL || 'https://kavi-api.digiyogi.com'}/api/v1/payments/webhook/phonepe`;
    const redirectUrl = `${process.env.APP_URL || 'https://kavi-api.digiyogi.com'}/api/v1/payments/callback/phonepe?txnId=${merchantTransactionId}`;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: input.userId,
      amount: Math.round(input.amount * 100), // paise
      redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = sha256(base64Payload + '/pg/v1/pay' + SALT_KEY) + '###' + SALT_INDEX;

    const response = await fetch(`${BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data: any = await response.json();

    if (!data.success) {
      throw new Error(`PhonePe order failed: ${data.message || 'Unknown error'}`);
    }

    const redirectInfo = data.data?.instrumentResponse?.redirectInfo;

    return {
      gatewayOrderId: merchantTransactionId,
      gateway: 'phonepe',
      amount: input.amount,
      currency: input.currency,
      checkoutData: {
        redirectUrl: redirectInfo?.url || '',
        merchantTransactionId,
      },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const path = `/pg/v1/status/${MERCHANT_ID}/${input.gatewayOrderId}`;
    const checksum = sha256(path + SALT_KEY) + '###' + SALT_INDEX;

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': MERCHANT_ID,
      },
    });

    const data: any = await response.json();
    const isSuccess = data.success && data.code === 'PAYMENT_SUCCESS';

    return {
      verified: isSuccess,
      gatewayPaymentId: data.data?.transactionId || input.gatewayPaymentId,
      amount: data.data?.amount ? data.data.amount / 100 : 0,
      status: isSuccess ? 'captured' : 'failed',
    };
  }

  async getOrderAmount(gatewayOrderId: string): Promise<number> {
    const result = await this.verifyPayment({
      gatewayOrderId,
      gatewayPaymentId: '',
    });
    return result.amount;
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    const xVerify = headers['x-verify'] || '';
    const [hash, index] = xVerify.split('###');
    if (!hash || index !== SALT_INDEX) return false;

    try {
      const body = JSON.parse(rawBody);
      const expected = sha256(body.response + SALT_KEY);
      return expected === hash;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(body: any, _headers: Record<string, string>): WebhookParseResult {
    let decoded: any = {};
    try {
      decoded = JSON.parse(Buffer.from(body.response, 'base64').toString('utf8'));
    } catch { /* ignore */ }

    const isSuccess = decoded.success && decoded.code === 'PAYMENT_SUCCESS';

    return {
      event: isSuccess ? 'payment.success' : 'payment.failed',
      gatewayOrderId: decoded.data?.merchantTransactionId || '',
      gatewayPaymentId: decoded.data?.transactionId || '',
      amount: decoded.data?.amount ? decoded.data.amount / 100 : 0,
      status: isSuccess ? 'captured' : 'failed',
      rawEvent: decoded.code || 'unknown',
    };
  }
}
