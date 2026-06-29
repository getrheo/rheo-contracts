import { describe, expect, it } from 'vitest';
import {
  ScreenBackgroundFillSchema,
  screenBackgroundPlaybackId,
  isScreenBackgroundPlaybackId,
} from './screenBackground.js';

describe('screenBackgroundPlaybackId', () => {
  it('uses stable prefix', () => {
    expect(screenBackgroundPlaybackId('scr_a')).toBe('__screen_bg__:scr_a');
    expect(isScreenBackgroundPlaybackId('__screen_bg__:scr_a')).toBe(true);
    expect(isScreenBackgroundPlaybackId('lyr_vid')).toBe(false);
  });
});

describe('ScreenBackgroundFillSchema', () => {
  it('parses color, image, and video fills', () => {
    expect(
      ScreenBackgroundFillSchema.safeParse({ kind: 'color', color: '#fff' }).success,
    ).toBe(true);
    expect(
      ScreenBackgroundFillSchema.safeParse({ kind: 'color', color: '#fff', opacity: 0.5 }).success,
    ).toBe(true);
    expect(
      ScreenBackgroundFillSchema.safeParse({
        kind: 'image',
        media: { mediaAssetId: '00000000-0000-4000-8000-000000000001' },
        fit: 'cover',
      }).success,
    ).toBe(true);
    expect(
      ScreenBackgroundFillSchema.safeParse({
        kind: 'video',
        media: { mediaAssetId: '00000000-0000-4000-8000-000000000001' },
        loop: true,
        audioEnabled: false,
      }).success,
    ).toBe(true);
  });
});
