import prisma from '../../config/database';
import {
  PaymentGateway, GatewayName, CreateOrderInput, CreateOrderResult,
  PaymentType,
} from './gateway.interface';
import { RazorpayAdapter } from './razorpay.adapter';
import { EasebuzzAdapter } from './easebuzz.adapter';
import { PhonePeAdapter } from './phonepe.adapter';
import { ZohoAdapter } from './zoho.adapter';

const SMART_ROUTING = process.env.SMART_ROUTING_ENABLED === 'true';
const DEFAULT_GATEWAY = (process.env.DEFAULT_GATEWAY || 'razorpay') as GatewayName;
const EXPLORATION_RATE = parseFloat(process.env.ROUTING_EXPLORATION_RATE || '0.2');

interface AttemptRecord {
  id: string;
  gateway: GatewayName;
  gatewayOrderId: string;
}

class PaymentOrchestrator {
  private adapters: Map<GatewayName, PaymentGateway> = new Map();

  constructor() {
    const all: PaymentGateway[] = [
      new RazorpayAdapter(),
      new EasebuzzAdapter(),
      new PhonePeAdapter(),
      new ZohoAdapter(),
    ];
    for (const a of all) {
      this.adapters.set(a.name, a);
    }
  }

  getAdapter(name: GatewayName): PaymentGateway | undefined {
    return this.adapters.get(name);
  }

  getEnabledGateways(): PaymentGateway[] {
    return Array.from(this.adapters.values()).filter((a) => a.isEnabled());
  }

  // ── Gateway Selection ──

  async selectGateway(_amount: number, _paymentType: PaymentType): Promise<PaymentGateway> {
    if (!SMART_ROUTING) {
      const defaultAdapter = this.adapters.get(DEFAULT_GATEWAY);
      if (defaultAdapter?.isEnabled()) return defaultAdapter;
      // fallback to any enabled
      const enabled = this.getEnabledGateways();
      if (enabled.length === 0) throw new Error('No payment gateways available');
      return enabled[0];
    }

    const enabled = this.getEnabledGateways();
    if (enabled.length === 0) throw new Error('No payment gateways available');
    if (enabled.length === 1) return enabled[0];

    // Score each gateway by recent success rate
    const scored: { gateway: PaymentGateway; score: number }[] = [];
    for (const gw of enabled) {
      const health = await this.getRecentHealth(gw.name);
      if (health?.isDown) continue; // skip downed gateways

      const successRate =
        health && health.totalAttempts > 5
          ? health.successCount / health.totalAttempts
          : 0.95; // default for new/unknown
      scored.push({ gateway: gw, score: successRate });
    }

    if (scored.length === 0) {
      // All down — pick least recently downed
      return enabled[0];
    }

    scored.sort((a, b) => b.score - a.score);

    // 20% exploration: try second-best
    if (scored.length > 1 && Math.random() < EXPLORATION_RATE) {
      return scored[1].gateway;
    }

    return scored[0].gateway;
  }

  // ── Order Creation with Failover ──

  async createOrderWithFailover(
    input: CreateOrderInput,
    preferredGateway?: GatewayName
  ): Promise<{ result: CreateOrderResult; attempt: AttemptRecord }> {
    const primary = preferredGateway
      ? this.adapters.get(preferredGateway) || (await this.selectGateway(input.amount, input.paymentType))
      : await this.selectGateway(input.amount, input.paymentType);

    const startMs = Date.now();

    try {
      const result = await primary.createOrder(input);

      // Record attempt in DB
      const attempt = await prisma.paymentAttempt.create({
        data: {
          userId: input.userId,
          paymentType: input.paymentType,
          amount: input.amount,
          currency: input.currency,
          gateway: primary.name,
          gatewayOrderId: result.gatewayOrderId,
          internalReceipt: input.receipt,
          status: 'INITIATED',
          planId: input.notes.planId || null,
          packageId: input.notes.packageId || null,
        },
      });

      await this.recordOutcome(primary.name, true, Date.now() - startMs);

      return {
        result,
        attempt: { id: attempt.id, gateway: primary.name as GatewayName, gatewayOrderId: result.gatewayOrderId },
      };
    } catch (primaryError: any) {
      await this.recordOutcome(primary.name, false, Date.now() - startMs);

      // Try fallback if smart routing is on
      if (!SMART_ROUTING) throw primaryError;

      const fallback = await this.selectGateway(input.amount, input.paymentType);
      if (fallback.name === primary.name) throw primaryError;

      const fallbackStart = Date.now();
      try {
        const result = await fallback.createOrder(input);

        const attempt = await prisma.paymentAttempt.create({
          data: {
            userId: input.userId,
            paymentType: input.paymentType,
            amount: input.amount,
            currency: input.currency,
            gateway: fallback.name,
            gatewayOrderId: result.gatewayOrderId,
            internalReceipt: input.receipt + '_retry',
            status: 'INITIATED',
            planId: input.notes.planId || null,
            packageId: input.notes.packageId || null,
            failoverFrom: primary.name,
            attemptNumber: 2,
          },
        });

        await this.recordOutcome(fallback.name, true, Date.now() - fallbackStart);

        return {
          result,
          attempt: { id: attempt.id, gateway: fallback.name as GatewayName, gatewayOrderId: result.gatewayOrderId },
        };
      } catch (fallbackError: any) {
        await this.recordOutcome(fallback.name, false, Date.now() - fallbackStart);
        throw primaryError; // throw original error
      }
    }
  }

  // ── Health Tracking ──

  private getCurrentWindowStart(): Date {
    const now = new Date();
    now.setMinutes(0, 0, 0); // round to current hour
    return now;
  }

  private async getRecentHealth(gateway: GatewayName) {
    return prisma.gatewayHealth.findFirst({
      where: { gateway },
      orderBy: { windowStart: 'desc' },
    });
  }

  async recordOutcome(gateway: GatewayName, success: boolean, responseMs: number): Promise<void> {
    const windowStart = this.getCurrentWindowStart();

    try {
      await prisma.gatewayHealth.upsert({
        where: { gateway_windowStart: { gateway, windowStart } },
        create: {
          gateway,
          windowStart,
          totalAttempts: 1,
          successCount: success ? 1 : 0,
          failureCount: success ? 0 : 1,
          avgResponseMs: responseMs,
          isDown: false,
          lastUpAt: success ? new Date() : undefined,
        },
        update: {
          totalAttempts: { increment: 1 },
          ...(success
            ? { successCount: { increment: 1 }, lastUpAt: new Date() }
            : { failureCount: { increment: 1 } }),
        },
      });

      // Evaluate if gateway should be marked down
      if (!success) {
        await this.evaluateGatewayHealth(gateway);
      }
    } catch {
      // Non-critical — don't fail payments over metrics
    }
  }

  private async evaluateGatewayHealth(gateway: GatewayName): Promise<void> {
    // Check last 10 attempts — if >50% failed, mark down
    const recent = await prisma.paymentAttempt.findMany({
      where: { gateway },
      orderBy: { initiatedAt: 'desc' },
      take: 10,
      select: { status: true },
    });

    if (recent.length < 5) return; // not enough data

    const failures = recent.filter((r: any) => r.status === 'FAILED').length;
    const failureRate = failures / recent.length;

    if (failureRate > 0.5) {
      const windowStart = this.getCurrentWindowStart();
      await prisma.gatewayHealth.upsert({
        where: { gateway_windowStart: { gateway, windowStart } },
        create: { gateway, windowStart, isDown: true, lastDownAt: new Date() },
        update: { isDown: true, lastDownAt: new Date() },
      });
    }
  }

  // ── Metrics API ──

  async getMetrics(): Promise<Record<GatewayName, { enabled: boolean; successRate: number; isDown: boolean; totalAttempts: number }>> {
    const result: any = {};
    for (const [name, adapter] of this.adapters) {
      const health = await this.getRecentHealth(name);
      result[name] = {
        enabled: adapter.isEnabled(),
        successRate: health && health.totalAttempts > 0
          ? Math.round((health.successCount / health.totalAttempts) * 100)
          : 100,
        isDown: health?.isDown || false,
        totalAttempts: health?.totalAttempts || 0,
      };
    }
    return result;
  }
}

export const orchestrator = new PaymentOrchestrator();
