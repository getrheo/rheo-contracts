import { describe, expect, it } from 'vitest';
import { FlowGraphNodeJumpTargetSchema } from './graphJumpTarget';

describe('FlowGraphNodeJumpTargetSchema', () => {
  it('accepts screen, decision, and external surface ids', () => {
    expect(FlowGraphNodeJumpTargetSchema.safeParse('scr_welcome').success).toBe(true);
    expect(FlowGraphNodeJumpTargetSchema.safeParse('dec_split').success).toBe(true);
    expect(FlowGraphNodeJumpTargetSchema.safeParse('surf_paywall').success).toBe(true);
  });

  it('rejects unknown id shapes', () => {
    expect(FlowGraphNodeJumpTargetSchema.safeParse('continue').success).toBe(false);
    expect(FlowGraphNodeJumpTargetSchema.safeParse('missing').success).toBe(false);
  });
});
