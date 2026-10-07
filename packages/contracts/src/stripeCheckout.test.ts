import { describe, expect, it } from 'vitest';
import { StripePaymentLinkUrlSchema, isStripePaymentLinkHost } from './externalSurfaces.js';
import {
  WebSdkOriginSchema,
  checkoutConfirmDecision,
  effectiveCheckoutAttemptStatus,
} from './stripeCheckout.js';

describe('Stripe Payment Link hosts', () => {
  it('accepts buy.stripe.com and other stripe hosts', () => {
    expect(StripePaymentLinkUrlSchema.parse('https://buy.stripe.com/test_abc')).toBe(
      'https://buy.stripe.com/test_abc',
    );
    expect(isStripePaymentLinkHost('pay.stripe.com')).toBe(true);
  });

  it('rejects non-stripe hosts', () => {
    expect(StripePaymentLinkUrlSchema.safeParse('https://evil.example/pay').success).toBe(false);
    expect(StripePaymentLinkUrlSchema.safeParse('http://buy.stripe.com/test_abc').success).toBe(false);
  });
});

describe('web SDK origins', () => {
  it('normalizes exact origins and rejects paths', () => {
    expect(WebSdkOriginSchema.parse('https://Example.com')).toBe('https://example.com');
    expect(WebSdkOriginSchema.parse('http://localhost:5173')).toBe('http://localhost:5173');
    expect(WebSdkOriginSchema.safeParse('https://example.com/funnel').success).toBe(false);
    expect(WebSdkOriginSchema.safeParse('http://example.com').success).toBe(false);
  });
});

describe('checkout attempt status', () => {
  it('expires a pending attempt after its deadline', () => {
    const expiresAt = new Date('2026-09-28T00:00:00.000Z');
    expect(
      effectiveCheckoutAttemptStatus({
        status: 'pending',
        expiresAt,
        now: new Date('2026-09-29T00:00:00.000Z'),
      }),
    ).toBe('expired');
    expect(
      effectiveCheckoutAttemptStatus({
        status: 'confirmed',
        expiresAt,
        now: new Date('2026-09-29T00:00:00.000Z'),
      }),
    ).toBe('confirmed');
  });

  it('treats a second confirm as a duplicate', () => {
    expect(checkoutConfirmDecision({ exists: true, status: 'confirmed' })).toBe('duplicate');
    expect(checkoutConfirmDecision({ exists: true, status: 'cancelled' })).toBe('confirm');
    expect(checkoutConfirmDecision({ exists: false, status: 'pending' })).toBe('missing');
  });
});
