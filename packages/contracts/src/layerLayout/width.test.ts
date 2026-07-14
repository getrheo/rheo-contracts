import { describe, expect, it } from 'vitest';
import { WidthValueSchema } from './width.js';

describe('WidthValueSchema', () => {
  it('accepts full, auto, fractions, and pixel values', () => {
    expect(WidthValueSchema.parse('full')).toBe('full');
    expect(WidthValueSchema.parse('auto')).toBe('auto');
    expect(WidthValueSchema.parse('1/2')).toBe('1/2');
    expect(WidthValueSchema.parse(120)).toBe(120);
  });

  it('preprocesses fill → full', () => {
    expect(WidthValueSchema.parse('fill')).toBe('full');
  });

  it('rejects unknown string presets', () => {
    expect(WidthValueSchema.safeParse('stretch').success).toBe(false);
  });
});
