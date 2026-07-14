import { describe, expect, it } from 'vitest';
import { ProgressLayerSchema, TextInputLayerSchema, ScaleInputLayerSchema } from './layers';

describe('styleBreakpoints on chrome/input layers', () => {
  it('ProgressLayerSchema keeps styleBreakpoints.md.padding', () => {
    const r = ProgressLayerSchema.safeParse({
      id: 'lyr_prog_bp',
      kind: 'progress',
      styleBreakpoints: { md: { padding: { t: 4, r: 4, b: 4, l: 4 } } },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.styleBreakpoints?.md?.padding).toEqual({ t: 4, r: 4, b: 4, l: 4 });
    }
  });

  it('TextInputLayerSchema keeps styleBreakpoints.md.padding', () => {
    const r = TextInputLayerSchema.safeParse({
      id: 'lyr_ti_bp',
      kind: 'text_input',
      fieldKey: 'email',
      classification: 'safe',
      styleBreakpoints: { md: { padding: { t: 6, r: 6, b: 6, l: 6 } } },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.styleBreakpoints?.md?.padding).toEqual({ t: 6, r: 6, b: 6, l: 6 });
    }
  });

  it('TextInputLayerSchema keeps typography fieldStyle', () => {
    const r = TextInputLayerSchema.safeParse({
      id: 'lyr_ti_fs',
      kind: 'text_input',
      fieldKey: 'email',
      classification: 'safe',
      fieldStyle: { fontSize: 16, fontWeight: 600 },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.fieldStyle?.fontSize).toBe(16);
      expect(r.data.fieldStyle?.fontWeight).toBe(600);
    }
  });

  it('ScaleInputLayerSchema keeps styleBreakpoints.md.padding', () => {
    const r = ScaleInputLayerSchema.safeParse({
      id: 'lyr_sc_bp',
      kind: 'scale_input',
      fieldKey: 'rating',
      min: 1,
      max: 5,
      styleBreakpoints: { md: { padding: { t: 2, r: 2, b: 2, l: 2 } } },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.styleBreakpoints?.md?.padding).toEqual({ t: 2, r: 2, b: 2, l: 2 });
    }
  });
});
