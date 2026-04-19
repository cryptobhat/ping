import { razorpayService } from '../razorpay.service';
import {
  PaymentGateway, GatewayName, CreateOrderInput, CreateOrderResult,
  VerifyPaymentInput, VerifyPaymentResult, WebhookParseResult,
} from './gateway.interface';

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

export class RazorpayAdapter implements PaymentGateway {
  name: GatewayName = 'razorpay';

  isEnabled(): boolean {
    return !!(KEY_ID && KEY_SECRET);
  }

  async isHealthy(): Promise<boolean> {
    return this.isEnabled();
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const order = await razorpayService.createOrder({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    });

    return {
      gatewayOrderId: order.orderId,
      gateway: 'razorpay',
      amount: order.amount,
      currency: order.currency,
      checkoutData: {
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
      },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const verified = razorpayService.verifyPayment({
      orderId: input.gatewayOrderId,
      paymentId: input.gatewayPaymentId,
      signature: input.signature || '',
    });

    let amount = 0;
    if (verified) {
      amount = await razorpayService.getOrderAmount(input.gatewayOrderId);
    }

    return {
      verified,
      gatewayPaymentId: input.gatewayPaymentId,
      amount,
      status: verified ? 'captured' : 'failed',
    };
  }

  async getOrderAmount(gatewayOrderId: string): Promise<number> {
    return razorpayService.getOrderAmount(gatewayOrderId);
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    const signature = headers['x-razorpay-signature'] || '';
    return razorpayService.verifyWebhook(rawBody, signature);
  }

  parseWebhookEvent(body: any, _headers: Record<string, string>): WebhookParseResult {
    const event = body.event || '';
    const payment = body.payload?.payment?.entity;

    let status: 'captured' | 'failed' | 'pending' = 'pending';
    if (event === 'payment.captured') status = 'captured';
    else if (event === 'payment.failed') status = 'failed';

    return {
      event: status === 'captured' ? 'payment.success' : status === 'failed' ? 'payment.failed' : event,
      gatewayOrderId: payment?.order_id || '',
      gatewayPaymentId: payment?.id || '',
      amount: payment ? payment.amount / 100 : 0,
      status,
      rawEvent: event,
    };
  }
}
