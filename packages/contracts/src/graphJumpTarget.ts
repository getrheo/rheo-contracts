import { z } from 'zod';
import { ScreenIdSchema } from './layers/ids.js';

export const DecisionNodeJumpIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^dec_[a-z0-9_]+$/i);

export const ExternalSurfaceJumpIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^surf_[a-z0-9_]+$/i);

/** Non-null jump to a screen, decision vertex, or external surface node. */
export const FlowGraphNodeJumpTargetSchema = ScreenIdSchema.or(DecisionNodeJumpIdSchema).or(
  ExternalSurfaceJumpIdSchema,
);
export type FlowGraphNodeJumpTarget = z.infer<typeof FlowGraphNodeJumpTargetSchema>;
