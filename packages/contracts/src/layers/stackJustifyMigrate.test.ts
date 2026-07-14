import { describe, expect, it } from 'vitest';
import { StackLayerSchema } from './index.js';

describe('StackLayerSchema justify → distribution migrate', () => {
  it('parses justify:center into distribution:center and drops justify', () => {
    const parsed = StackLayerSchema.parse({
      id: 'lyr_stack_justify',
      kind: 'stack',
      direction: 'vertical',
      justify: 'center',
      children: [],
    });
    expect(parsed.distribution).toBe('center');
    expect('justify' in parsed).toBe(false);
  });

  it('keeps authored distribution when both justify and distribution are present', () => {
    const parsed = StackLayerSchema.parse({
      id: 'lyr_stack_both',
      kind: 'stack',
      direction: 'horizontal',
      justify: 'end',
      distribution: 'between',
      children: [],
    });
    expect(parsed.distribution).toBe('between');
    expect('justify' in parsed).toBe(false);
  });
});
