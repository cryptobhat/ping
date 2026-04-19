import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;

  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    return null;
  }

  client = new PostHog(apiKey, {
    host,
    flushAt: 20,
    flushInterval: 10000, // flush every 10 seconds
  });

  return client;
}

// ---- Event names ----
export const AnalyticsEvent = {
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  CONTENT_CREATED: 'content_created',
  CONTENT_READ: 'content_read',
  SERIES_CREATED: 'series_created',
  GIFT_SENT: 'gift_sent',
  SUBSCRIPTION_PURCHASED: 'subscription_purchased',
  WITHDRAWAL_REQUESTED: 'withdrawal_requested',
} as const;

type EventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

// ---- Public API ----

/**
 * Track an analytics event for a given user.
 * Silently no-ops when PostHog is not configured (missing API key).
 */
export function trackEvent(
  userId: string,
  event: EventName,
  properties?: Record<string, unknown>
): void {
  const ph = getClient();
  if (!ph) return;

  try {
    ph.capture({
      distinctId: userId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error(`[Analytics] Failed to track ${event}:`, err);
  }
}

/**
 * Identify a user with traits (called on signup / profile update).
 */
export function identifyUser(
  userId: string,
  traits: Record<string, unknown>
): void {
  const ph = getClient();
  if (!ph) return;

  try {
    ph.identify({
      distinctId: userId,
      properties: traits,
    });
  } catch (err) {
    console.error('[Analytics] Failed to identify user:', err);
  }
}

/**
 * Gracefully shut down the PostHog client (call on process exit).
 */
export async function shutdownAnalytics(): Promise<void> {
  if (client) {
    await client.shutdown();
    client = null;
  }
}
