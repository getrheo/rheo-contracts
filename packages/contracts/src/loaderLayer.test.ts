import { describe, expect, it } from 'vitest';
import { LoaderLayerSchema } from './layers';

describe('LoaderLayerSchema', () => {
  it('accepts minimal loader', () => {
    const r = LoaderLayerSchema.safeParse({
      id: 'lyr_ld1',
      kind: 'loader',
    });
    expect(r.success).toBe(true);
  });

  it('accepts onComplete screen branch', () => {
    const r = LoaderLayerSchema.safeParse({
      id: 'lyr_ld2',
      kind: 'loader',
      onComplete: { mode: 'screen', screenId: 'scr_next' },
      targetPercent: 50,
      durationMs: 500,
    });
    expect(r.success).toBe(true);
  });

  it('accepts onComplete to decision and external surface targets', () => {
    expect(
      LoaderLayerSchema.safeParse({
        id: 'lyr_ld6',
        kind: 'loader',
        onComplete: { mode: 'screen', screenId: 'dec_split' },
      }).success,
    ).toBe(true);
    expect(
      LoaderLayerSchema.safeParse({
        id: 'lyr_ld7',
        kind: 'loader',
        onComplete: { mode: 'screen', screenId: 'surf_paywall' },
      }).success,
    ).toBe(true);
  });

  it('accepts horizontal align', () => {
    const r = LoaderLayerSchema.safeParse({
      id: 'lyr_ld3',
      kind: 'loader',
      variant: 'circular',
      align: 'center',
    });
    expect(r.success).toBe(true);
  });

  it('accepts trackOpacity', () => {
    const r = LoaderLayerSchema.safeParse({
      id: 'lyr_ld5',
      kind: 'loader',
      trackOpacity: 0.35,
    });
    expect(r.success).toBe(true);
  });

  it('rejects fillDelayMs out of range', () => {
    const r = LoaderLayerSchema.safeParse({
      id: 'lyr_ld4',
      kind: 'loader',
      fillDelayMs: 10_001,
    });
    expect(r.success).toBe(false);
  });

  it('accepts styleBreakpoints without stripping', () => {
    const r = LoaderLayerSchema.safeParse({
      id: 'lyr_ld_bp',
      kind: 'loader',
      styleBreakpoints: { md: { padding: { t: 8, r: 8, b: 8, l: 8 } } },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.styleBreakpoints?.md?.padding).toEqual({ t: 8, r: 8, b: 8, l: 8 });
    }
  });
});
