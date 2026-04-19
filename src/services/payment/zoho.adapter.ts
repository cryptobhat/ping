import crypto from 'crypto';
import {
  PaymentGateway, GatewayName, CreateOrderInput, CreateOrderResult,
  VerifyPaymentInput, VerifyPaymentResult, WebhookParseResult,
} from './gateway.interface';

const ORG_ID = process.env.ZOHO_ORG_ID || '';
const CLIENT_ID = process.env.ZOHO_CLIENT_ID || '';
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const WEBHOOK_SECRET = process.env.ZOHO_WEBHOOK_SECRET || '';

const BASE_URL = 'https://payments.zoho.in/api/v1';

let accessToken = '';
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'ZohoPayments.fullaccess.all',
    }).toString(),
  });

  const data: any = await response.json();
  if (!data.access_token) {
    throw new Error(`Zoho auth failed: ${data.error || 'Unknown'}`);
  }

  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

export class ZohoAdapter implements PaymentGateway {
  name: GatewayName = 'zoho';

  isEnabled(): boolean {
    return !!(ORG_ID && CLIENT_ID && CLIENT_SECRET);
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isEnabled()) return false;
    try {
      await getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const token = await getAccessToken();
    const callbackUrl = `${process.env.APP_URL || 'https://kavi-api.digiyogi.com'}/api/v1/payments/callback/zoho`;

    const response = await fetch(`${BASE_URL}/paymentlinks`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        'X-com-zoho-payments-organizationid': ORG_ID,
      },
      body: JSON.stringify({
        amount: input.amount * 100, // paise
        currency_code: 'INR',
        description: `${input.paymentType} purchase`,
        reference_id: input.receipt,
        callback_url: callbackUrl,
        customer: {
          name: input.notes.userId || 'User',
        },
      }),
    });

    const data: any = await response.json();

    if (data.code !== 0 && !data.payment_link) {
      throw new Error(`Zoho order failed: ${data.message || 'Unknown error'}`);
    }

    const link = data.payment_link || data;

    return {
      gatewayOrderId: link.payment_link_id || input.receipt,
      gateway: 'zoho',
      amount: input.amount,
      currency: input.currency,
      checkoutData: {
        paymentUrl: link.url || link.payment_url || '',
        paymentLinkId: link.payment_link_id || '',
        redirectUrl: link.url || link.payment_url || '',
      },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const token = await getAccessToken();

    const response = await fetch(`${BASE_URL}/paymentlinks/${input.gatewayOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'X-com-zoho-payments-organizationid': ORG_ID,
      },
    });

    const data: any = await response.json();
    const link = data.payment_link || data;
    const isSuccess = link.status === 'paid';

    return {
      verified: isSuccess,
      gatewayPaymentId: link.payment_id || input.gatewayPaymentId,
      amount: link.amount ? link.amount / 100 : 0,
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
    if (!WEBHOOK_SECRET) return false;
    const signature = headers['x-zoho-webhook-signature'] || '';
    try {
      const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex')
      );
    } catch {
      return false;
    }
  }

  parseWebhookEvent(body: any, _headers: Record<string, string>): WebhookParseResult {
    const event = body.event_type || '';
    const payment = body.payment || body.data?.payment || {};
    const isSuccess = event === 'payment.success' || payment.status === 'paid';

    return {
      event: isSuccess ? 'payment.success' : 'payment.failed',
      gatewayOrderId: payment.reference_id || body.reference_id || '',
      gatewayPaymentId: payment.payment_id || '',
      amount: payment.amount ? payment.amount / 100 : 0,
      status: isSuccess ? 'captured' : 'failed',
      rawEvent: event,
    };
  }
}
