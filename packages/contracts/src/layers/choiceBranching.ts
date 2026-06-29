import { z } from 'zod';
import { LayerIdSchema, ScreenIdSchema } from './ids.js';

export const ChoiceOptionBindingSchema = z.object({
  optionId: z.string().min(1).max(64),
  rootLayerId: LayerIdSchema,
});
export type ChoiceOptionBinding = z.infer<typeof ChoiceOptionBindingSchema>;

export const BranchConditionSchema = z.object({
  choiceId: z.string().min(1),
  goTo: ScreenIdSchema,
});
export type BranchCondition = z.infer<typeof BranchConditionSchema>;

export const ChoiceBranchingSchema = z.object({
  enabled: z.boolean(),
  conditions: z.array(BranchConditionSchema),
});
export type ChoiceBranching = z.infer<typeof ChoiceBranchingSchema>;
