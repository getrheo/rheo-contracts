import { describe, expect, it } from 'vitest';
import { CommonStyleSchema } from './styleCommon.js';

describe('CommonStyle size clamps', () => {
  it('accepts optional min/max width and height', () => {
    const r = CommonStyleSchema.safeParse({
      minWidth: 0,
      maxWidth: 100,
      minHeight: 24,
      maxHeight: 2000,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toEqual({
        minWidth: 0,
        maxWidth: 100,
        minHeight: 24,
        maxHeight: 2000,
      });
    }
  });

  it('rejects clamps above 2000', () => {
    expect(CommonStyleSchema.safeParse({ maxWidth: 2001 }).success).toBe(false);
    expect(CommonStyleSchema.safeParse({ minHeight: -1 }).success).toBe(false);
  });
});
