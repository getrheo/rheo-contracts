import { describe, expect, it } from 'vitest';
import { ButtonActionSchema } from './actions.js';

describe('advance_carousel button action', () => {
  it('parses with an explicit onLast', () => {
    const parsed = ButtonActionSchema.parse({
      kind: 'advance_carousel',
      targetLayerId: 'lyr_car_1',
      onLast: 'complete',
    });
    expect(parsed).toEqual({
      kind: 'advance_carousel',
      targetLayerId: 'lyr_car_1',
      onLast: 'complete',
    });
  });

  it('leaves onLast undefined when omitted (renderers default to noop)', () => {
    const parsed = ButtonActionSchema.parse({
      kind: 'advance_carousel',
      targetLayerId: 'lyr_car_1',
    });
    expect(parsed).toEqual({ kind: 'advance_carousel', targetLayerId: 'lyr_car_1' });
  });

  it('rejects an empty target layer id', () => {
    expect(
      ButtonActionSchema.safeParse({ kind: 'advance_carousel', targetLayerId: '' }).success,
    ).toBe(false);
  });

  it('rejects a missing target layer id', () => {
    expect(ButtonActionSchema.safeParse({ kind: 'advance_carousel' }).success).toBe(false);
  });

  it('rejects an unknown onLast value', () => {
    expect(
      ButtonActionSchema.safeParse({
        kind: 'advance_carousel',
        targetLayerId: 'lyr_car_1',
        onLast: 'continue',
      }).success,
    ).toBe(false);
  });
});
