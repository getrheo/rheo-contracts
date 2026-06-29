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
});
