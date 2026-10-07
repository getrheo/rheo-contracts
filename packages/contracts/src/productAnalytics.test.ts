import { describe, expect, it, vi } from 'vitest';
import {
  PRODUCT_ANALYTICS_SESSION_TIMEOUT_MS,
  SdkProductAnalyticsBatchSchema,
  advanceProductAnalyticsSession,
  type ProductAnalyticsStorage,
} from './productAnalytics';
import { ProductAnalyticsClient } from './productAnalyticsClient';

const memoryStorage = (): ProductAnalyticsStorage => {
  const map = new Map<string, string>();
  return {
    get: async (key) => map.get(key) ?? null,
    set: async (key, value) => {
      map.set(key, value);
    },
  };
};

describe('product analytics contract', () => {
  it('accepts a batch without flow ids', () => {
    const parsed = SdkProductAnalyticsBatchSchema.parse({
      events: [
        {
          eventId: '11111111-1111-4111-8111-111111111111',
          name: 'workout_logged',
          timestamp: '2026-09-28T12:00:00.000Z',
          identity: { appUserId: 'u1', sessionId: 's1' },
          screenName: '/home',
          properties: { minutes: 30 },
        },
      ],
    });
    expect(parsed.events[0]?.name).toBe('workout_logged');
  });

  it('rejects oversized properties', () => {
    expect(() =>
      SdkProductAnalyticsBatchSchema.parse({
        events: [
          {
            eventId: '11111111-1111-4111-8111-111111111111',
            name: 'big',
            timestamp: '2026-09-28T12:00:00.000Z',
            identity: { appUserId: 'u1' },
            properties: { blob: 'x'.repeat(33 * 1024) },
          },
        ],
      }),
    ).toThrow();
  });
});

describe('product analytics session', () => {
  it('starts a session, then reuses it inside 30 minutes', async () => {
    const storage = memoryStorage();
    let n = 0;
    const first = await advanceProductAnalyticsSession(storage, 1_000, () => `id-${n++}`);
    const second = await advanceProductAnalyticsSession(storage, 1_000 + 60_000, () => `id-${n++}`);
    expect(first.started).toBe(true);
    expect(second.started).toBe(false);
    expect(second.sessionId).toBe(first.sessionId);
  });

  it('starts a new session after 30 minutes', async () => {
    const storage = memoryStorage();
    let n = 0;
    const first = await advanceProductAnalyticsSession(storage, 1_000, () => `id-${n++}`);
    const second = await advanceProductAnalyticsSession(
      storage,
      1_000 + PRODUCT_ANALYTICS_SESSION_TIMEOUT_MS,
      () => `id-${n++}`,
    );
    expect(second.started).toBe(true);
    expect(second.sessionId).not.toBe(first.sessionId);
  });
});

describe('ProductAnalyticsClient', () => {
  it('emits session_start and first_open without a flow, then custom events and screens', async () => {
    const events: Array<{ name: string; screenName?: string; sessionId?: string }> = [];
    const now = Date.parse('2026-09-28T12:00:00.000Z');
    let n = 0;
    const client = new ProductAnalyticsClient({
      storage: memoryStorage(),
      enqueue: (event) => {
        events.push({
          name: event.name,
          screenName: event.screenName,
          sessionId: event.identity.sessionId,
        });
      },
      now: () => now,
      createId: () => `11111111-1111-4111-8111-11111111111${n++}`,
      firstEventName: 'first_open',
      getIdentity: () => ({ appUserId: 'user-1' }),
      getContext: () => ({ platform: 'ios' }),
    });
    await client.start();
    client.logEvent('workout_logged', { minutes: 12 });
    client.view('screen_view', 'Home');
    client.view('screen_view', 'Home');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(events.map((event) => event.name)).toEqual([
      'session_start',
      'first_open',
      'workout_logged',
      'screen_view',
    ]);
    expect(new Set(events.map((event) => event.sessionId)).size).toBe(1);
    expect(events.find((event) => event.name === 'screen_view')?.screenName).toBe('Home');
  });

  it('holds session_start until the attribution gate resolves', async () => {
    vi.useFakeTimers();
    const events: Array<{ name: string; source?: string }> = [];
    let source = '';
    let release: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    const client = new ProductAnalyticsClient({
      storage: memoryStorage(),
      enqueue: (event) => {
        events.push({
          name: event.name,
          source: event.context?.attribution?.['acquisition.source'] as string | undefined,
        });
      },
      now: () => Date.parse('2026-09-28T12:00:00.000Z'),
      createId: () => '11111111-1111-4111-8111-111111111111',
      firstEventName: 'first_visit',
      getIdentity: () => ({ appUserId: 'user-1' }),
      getContext: () => ({
        platform: 'web',
        ...(source ? { attribution: { 'acquisition.source': source } } : {}),
      }),
      whenAttributionReady: () => ready,
      attributionWaitMs: 3_000,
    });
    const started = client.start();
    await vi.advanceTimersByTimeAsync(2_999);
    expect(events).toEqual([]);
    source = 'tiktok';
    release();
    await started;
    expect(events.map((event) => event.name)).toEqual(['session_start', 'first_visit']);
    expect(events[0]?.source).toBe('tiktok');
    vi.useRealTimers();
  });

  it('keeps the landing attribution for the rest of the session', async () => {
    const events: Array<{ name: string; source?: string }> = [];
    let source = 'google';
    let now = Date.parse('2026-09-28T12:00:00.000Z');
    const client = new ProductAnalyticsClient({
      storage: memoryStorage(),
      enqueue: (event) => {
        events.push({
          name: event.name,
          source: event.context?.attribution?.['acquisition.source'] as string | undefined,
        });
      },
      now: () => now,
      createId: () => '22222222-2222-4222-8222-222222222222',
      firstEventName: 'first_visit',
      getIdentity: () => ({ appUserId: 'user-1' }),
      getContext: () => ({
        platform: 'web',
        attribution: { 'acquisition.source': source },
      }),
    });
    await client.start();
    source = 'email';
    client.logEvent('cta_clicked');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(events.map((event) => event.source)).toEqual(['google', 'google', 'google']);
    now += 31 * 60 * 1000;
    client.logEvent('cta_clicked');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(events.at(-1)?.source).toBe('email');
    expect(events.at(-2)?.name).toBe('session_start');
  });
});
