import { z } from 'zod';

// Wallet validators
export const addMoneySchema = z.object({
  amount: z.number().int().min(10, 'Minimum amount is ₹10').max(100000, 'Maximum amount is ₹1,00,000'),
  paymentId: z.string().min(1, 'Payment ID is required'),
});

export const withdrawMoneySchema = z.object({
  amount: z.number().int().min(100, 'Minimum withdrawal is ₹100').max(100000, 'Maximum withdrawal is ₹1,00,000'),
  description: z.string().max(500).optional(),
});

export const buyCoinsSchema = z.object({
  coins: z.number().int().min(10, 'Minimum purchase is 10 coins').max(100000),
});

export const buyPensSchema = z.object({
  pens: z.number().int().min(1, 'Minimum purchase is 1 pen').max(10000),
});

// Gift validators
export const sendGiftSchema = z.object({
  receiverId: z.string().min(1, 'Receiver is required'),
  giftId: z.string().min(1, 'Gift is required'),
  message: z.string().max(500).optional(),
});

// Coin validators
export const purchaseCoinsSchema = z.object({
  packageId: z.string().uuid('Invalid package ID'),
});

// Payment validators
export const createOrderSchema = z.object({
  amount: z.number().int().min(1, 'Amount must be at least 1').max(1000000),
  type: z.enum(['wallet', 'coins', 'subscription', 'pens'], { message: 'Invalid payment type' }),
  planId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  preferredGateway: z.enum(['razorpay', 'easebuzz', 'phonepe', 'zoho']).optional(),
});

export const verifyPaymentSchema = z.object({
  // New flow (gateway-agnostic)
  attemptId: z.string().uuid().optional(),
  gatewayPaymentId: z.string().optional(),
  // Legacy Razorpay flow (backward compat)
  orderId: z.string().optional(),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
  type: z.enum(['wallet', 'coins', 'subscription', 'pens']).optional(),
  planId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
});
