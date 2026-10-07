import { describe, expect, it } from 'vitest';
import { SdkIdentifyRequestSchema, SdkTrackRequestSchema } from './index';

describe('PRD-1 track + identify attribute contracts', () => {
  it('accepts free-string track names without flow ids', () => {
    const parsed = SdkTrackRequestSchema.parse({
      eventId: '11111111-1111-4111-8111-111111111111',
      name: 'workout_logged',
      timestamp: '2026-09-22T12:00:00.000Z',
      identity: { appUserId: 'u1' },
      properties: { minutes: 30 },
    });
    expect(parsed.name).toBe('workout_logged');
  });

  it('rejects oversized track properties', () => {
    expect(() =>
      SdkTrackRequestSchema.parse({
        eventId: '11111111-1111-4111-8111-111111111111',
        name: 'big',
        timestamp: '2026-09-22T12:00:00.000Z',
        identity: { appUserId: 'u1' },
        properties: { blob: 'x'.repeat(33 * 1024) },
      }),
    ).toThrow();
  });

  it('accepts bounded identify attributes', () => {
    const parsed = SdkIdentifyRequestSchema.parse({
      appUserId: 'u1',
      attributes: { first_name: 'Ada', score: 1, active: true, note: null },
    });
    expect(parsed.attributes?.first_name).toBe('Ada');
  });

  it('accepts IANA timezone on identify (PRD-3)', () => {
    const parsed = SdkIdentifyRequestSchema.parse({
      appUserId: 'u1',
      timezone: 'Europe/Berlin',
    });
    expect(parsed.timezone).toBe('Europe/Berlin');
  });

  it('rejects invalid timezone on identify', () => {
    expect(() =>
      SdkIdentifyRequestSchema.parse({
        appUserId: 'u1',
        timezone: 'Not/A_Zone',
      }),
    ).toThrow();
  });

  it('accepts deprecated emailMarketingConsent as marketingConsent', () => {
    const parsed = SdkIdentifyRequestSchema.parse({
      appUserId: 'u1',
      email: 'a@example.com',
      emailMarketingConsent: 'granted',
    });
    expect(parsed.marketingConsent).toBe('granted');
    expect(parsed).not.toHaveProperty('emailMarketingConsent');
  });

  it('rejects disagreeing marketing consent aliases', () => {
    expect(() =>
      SdkIdentifyRequestSchema.parse({
        appUserId: 'u1',
        email: 'a@example.com',
        marketingConsent: 'granted',
        emailMarketingConsent: 'denied',
      }),
    ).toThrow(/disagree/);
  });

  it('rejects more than 50 attribute keys', () => {
    const attributes = Object.fromEntries(Array.from({ length: 51 }, (_, i) => [`k${i}`, 'v']));
    expect(() =>
      SdkIdentifyRequestSchema.parse({
        appUserId: 'u1',
        attributes,
      }),
    ).toThrow();
  });
});
