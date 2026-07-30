import { z } from 'zod';
import { ScreenIdSchema } from './layers';
import { DecisionExprSchema, collectDecisionFieldKeys, collectDecisionSdkKeys } from './decisionExpr.js';

export * from './decisionExpr.js';

export const DecisionNodeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^dec_[a-z0-9_]+$/i, 'decision node id must look like dec_<id>');
export type DecisionNodeId = z.infer<typeof DecisionNodeIdSchema>;

/** External surface node id shape; declared here to avoid a circular import. */
const ExternalSurfaceJumpIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^surf_[a-z0-9_]+$/i, 'external surface node id must look like surf_<id>');

/**
 * Terminal jump target for an external surface branch: end the flow immediately
 * after this outcome (no next screen). Distinct from omitting the outcome, which
 * falls through to {@link ExternalSurfaceNode.fallback}.
 */
export const EXTERNAL_SURFACE_NO_NEXT = '__onb_surface_no_next__' as const;

/**
 * React Flow `Handle.id` / edge `sourceHandle` for a decision node's catch-all
 * output (`elseNext`). Not a {@link FlowJumpTarget}.
 */
export const DECISION_ELSE_SOURCE_HANDLE = '__dec_else__' as const;

const ExternalSurfaceTerminalTargetSchema = z.literal(EXTERNAL_SURFACE_NO_NEXT);

/** Nullable jump target from a screen, decision, or external surface: another screen, a decision vertex, or an external surface. */
export const FlowJumpTargetSchema = ScreenIdSchema
  .or(DecisionNodeIdSchema)
  .or(ExternalSurfaceJumpIdSchema)
  .or(ExternalSurfaceTerminalTargetSchema)
  .nullable();
export type FlowJumpTarget = z.infer<typeof FlowJumpTargetSchema>;

/** One ordered segment evaluated before {@link DecisionNode.elseNext}. */
export const DecisionCaseSchema = z.object({
  id: z.string().min(1).max(80),
  /** Display label in the editor (e.g. “Engaged users”). */
  name: z.string().min(1).max(80).optional(),
  expression: DecisionExprSchema,
  next: FlowJumpTargetSchema,
});
export type DecisionCase = z.infer<typeof DecisionCaseSchema>;

/**
 * Multi-branch decision: `cases` are evaluated in order; the first matching
 * expression routes to that case’s `next`. If none match, `elseNext` is used
 * (“everyone else”).
 */
export const DecisionNodeSchema = z.object({
  id: DecisionNodeIdSchema,
  name: z.string().min(1).max(80).optional(),
  cases: z.array(DecisionCaseSchema).min(1).max(16),
  elseNext: FlowJumpTargetSchema,
});
export type DecisionNode = z.infer<typeof DecisionNodeSchema>;

/**
 * Migrate a persisted binary decision (`expression` + `onTrue` / `onFalse`) to
 * the multi-segment shape in-place. No-op when already migrated.
 */
export const migrateLegacyDecisionNodeInPlace = (node: Record<string, unknown>): void => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.cases)) return;
  if (!('expression' in node)) return;
  const id = typeof node.id === 'string' ? node.id : 'dec_unknown';
  const expression = node.expression;
  const onTrue = 'onTrue' in node ? (node.onTrue as FlowJumpTarget | null | undefined) ?? null : null;
  const onFalse = 'onFalse' in node ? (node.onFalse as FlowJumpTarget | null | undefined) ?? null : null;
  delete node.expression;
  delete node.onTrue;
  delete node.onFalse;
  node.cases = [
    {
      id: `${id}_case_0`,
      name: 'Group 1',
      expression,
      next: onTrue,
    },
  ];
  node.elseNext = onFalse;
};

export const collectDecisionSdkKeysFromNode = (node: DecisionNode): string[] => {
  const seen = new Set<string>();
  for (const c of node.cases) {
    for (const k of collectDecisionSdkKeys(c.expression)) seen.add(k);
  }
  return [...seen];
};

export const collectDecisionFieldKeysFromNode = (node: DecisionNode): string[] => {
  const seen = new Set<string>();
  for (const c of node.cases) {
    for (const k of collectDecisionFieldKeys(c.expression)) seen.add(k);
  }
  return [...seen];
};
