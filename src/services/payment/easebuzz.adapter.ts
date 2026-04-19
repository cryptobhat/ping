import crypto from 'crypto';
import {
  PaymentGateway, GatewayName, CreateOrderInput, CreateOrderResult,
  VerifyPaymentInput, VerifyPaymentResult, WebhookParseResult,
} from './gateway.interface';

const KEY = process.env.EASEBUZZ_KEY || '';
const SALT = process.env.EASEBUZZ_SALT || '';
const ENV = process.env.EASEBUZZ_ENV || 'test';

const BASE_URL = ENV === 'prod'
  ? 'https://pay.easebuzz.in'
  : 'https://testpay.easebuzz.in';

function generateHash(params: string[]): string {
  const str = params.join('|');
  return crypto.createHash('sha512').update(str).digest('hex');
}

export class EasebuzzAdapter implements PaymentGateway {
  name: GatewayName = 'easebuzz';

  isEnabled(): boolean {
    return !!(KEY && SALT);
  }

  async isHealthy(): Promise<boolean> {
    return this.isEnabled();
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const txnid = input.receipt;
    const amount = input.amount.toFixed(2);
    const productinfo = `${input.paymentType}_purchase`;
    const firstname = input.notes.userId || 'User';
    const email = input.notes.email || 'user@kalaloka.buzz';
    const phone = input.notes.phone || '';

    // Hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const hashString = `${KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const formData = new URLSearchParams({
      key: KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      surl: `${process.env.APP_URL || 'https://kavi-api.digiyogi.com'}/api/v1/payments/callback/easebuzz?status=success`,
      furl: `${process.env.APP_URL || 'https://kavi-api.digiyogi.com'}/api/v1/payments/callback/easebuzz?status=failure`,
      hash,
    });

    const response = await fetch(`${BASE_URL}/payment/initiateLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data: any = await response.json();

    if (data.status !== 1) {
      throw new Error(`Easebuzz order failed: ${data.data || 'Unknown error'}`);
    }

    return {
      gatewayOrderId: txnid,
      gateway: 'easebuzz',
      amount: input.amount,
      currency: input.currency,
      checkoutData: {
        accessKey: data.data,
        paymentUrl: `${BASE_URL}/pay/${data.data}`,
        txnid,
      },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const hashString = `${KEY}|${input.gatewayOrderId}|${SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const response = await fetch(`${BASE_URL}/transaction/v2.1/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ key: KEY, txnid: input.gatewayOrderId, hash }).toString(),
    });

    const data: any = await response.json();
    const txn = data.msg?.[0] || data.msg;

    const isSuccess = txn?.status === 'success';

    return {
      verified: isSuccess,
      gatewayPaymentId: txn?.easepayid || input.gatewayPaymentId,
      amount: parseFloat(txn?.amount || '0'),
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
    // Easebuzz sends response hash in the body itself
    try {
      const data = JSON.parse(rawBody);
      if (!data.hash) return false;

      // Reverse hash: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
      const reverseHash = `${SALT}|${data.status}|||||||||||${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${KEY}`;
      const expected = crypto.createHash('sha512').update(reverseHash).digest('hex');
      return expected === data.hash;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(body: any, _headers: Record<string, string>): WebhookParseResult {
    const isSuccess = body.status === 'success';
    return {
      event: isSuccess ? 'payment.success' : 'payment.failed',
      gatewayOrderId: body.txnid || '',
      gatewayPaymentId: body.easepayid || '',
      amount: parseFloat(body.amount || '0'),
      status: isSuccess ? 'captured' : 'failed',
      rawEvent: body.status || 'unknown',
    };
  }
}
