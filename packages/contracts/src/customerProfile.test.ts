import { describe, expect, it } from 'vitest';
import { SdkIdentifyRequestSchema } from './identify';
import { mergeStoredAttributes, resolveProfileWrite } from './customerProfile';

describe('customer profile fields', () => {
  it('clears a column on an empty string and ignores JSON null', () => {
    const cleared = SdkIdentifyRequestSchema.parse({
      appUserId: 'u1',
      firstName: '',
      country: ' us ',
      timezone: '   ',
    });
    expect(cleared.firstName).toBeNull();
    expect(cleared.country).toBe('US');
    expect(cleared.timezone).toBeNull();

    const omitted = SdkIdentifyRequestSchema.parse({
      appUserId: 'u1',
      firstName: null,
      lastName: null,
    });
    expect(omitted.firstName).toBeUndefined();
    expect(omitted.lastName).toBeUndefined();
  });

  it('rejects an invalid country and an over-long name', () => {
    expect(() => SdkIdentifyRequestSchema.parse({ appUserId: 'u1', country: 'USA' })).toThrow(
      /two-letter/,
    );
    expect(() =>
      SdkIdentifyRequestSchema.parse({ appUserId: 'u1', firstName: 'a'.repeat(81) }),
    ).toThrow();
  });

  it('lifts reserved attribute keys and lets the top-level field win', () => {
    const resolved = resolveProfileWrite({
      firstName: 'Grace',
      attributes: {
        first_name: 'Ada',
        last_name: '  Lovelace ',
        country: 'gb',
        phone: '',
        timezone: 'not-a-zone',
        plan: 'pro',
      },
    });
    expect(resolved.profile).toEqual({
      firstName: 'Grace',
      lastName: 'Lovelace',
      country: 'GB',
      phone: null,
    });
    expect(resolved.attributes).toEqual({
      timezone: 'not-a-zone',
      plan: 'pro',
    });
  });

  it('strips reserved keys from stored JSON when the column is written', () => {
    const resolved = resolveProfileWrite({
      attributes: { first_name: 'Ada', plan: 'pro' },
    });
    const stored = mergeStoredAttributes(
      { first_name: 'Old', plan: 'free', city: 'London' },
      resolved.attributes,
      resolved.profile,
    );
    expect(stored).toEqual({ plan: 'pro', city: 'London' });
    expect(resolved.profile.firstName).toBe('Ada');
  });

  it('clears a column and removes the JSON key when the attribute is blank', () => {
    const resolved = resolveProfileWrite({
      attributes: { phone: '   ' },
    });
    expect(resolved.profile.phone).toBeNull();
    const stored = mergeStoredAttributes(
      { phone: '+1555', plan: 'pro' },
      resolved.attributes,
      resolved.profile,
    );
    expect(stored).toEqual({ plan: 'pro' });
  });
});
