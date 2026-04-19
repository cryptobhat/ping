export type GatewayName = 'razorpay' | 'easebuzz' | 'phonepe' | 'zoho';

export type PaymentType = 'wallet' | 'coins' | 'subscription' | 'pens';

export interface CreateOrderInput {
  amount: number;
  currency: string;
  receipt: string;
  userId: string;
  paymentType: PaymentType;
  notes: Record<string, string>;
}

export interface CreateOrderResult {
  gatewayOrderId: string;
  gateway: GatewayName;
  amount: number;
  currency: string;
  /** Gateway-specific data the client needs to open checkout */
  checkoutData: Record<string, any>;
}

export interface VerifyPaymentInput {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature?: string;
  rawBody?: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  gatewayPaymentId: string;
  amount: number;
  status: 'captured' | 'failed' | 'pending';
}

export interface WebhookParseResult {
  event: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  amount: number;
  status: 'captured' | 'failed' | 'pending';
  rawEvent: string;
}

export interface PaymentGateway {
  name: GatewayName;
  isEnabled(): boolean;
  isHealthy(): Promise<boolean>;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  getOrderAmount(gatewayOrderId: string): Promise<number>;
  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean;
  parseWebhookEvent(body: any, headers: Record<string, string>): WebhookParseResult;
}
