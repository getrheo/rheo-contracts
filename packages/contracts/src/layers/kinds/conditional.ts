import { z } from 'zod';
import { DecisionExprSchema } from '../../decisionExpr.js';
import type { DecisionExpr } from '../../decisionExpr.js';
import { baseLayerShape } from '../base.js';
import { LayerIdSchema } from '../ids.js';
import type { StackLayerRaw } from '../layerRawTypes.js';
import { StackLayerSchema } from './layout.js';

/** Max ordered branches before the else stack (mirrors decision node cases). */
export const CONDITIONAL_MAX_CASES = 16;

export const ConditionalCaseSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80).optional(),
  expression: DecisionExprSchema,
  rootLayerId: LayerIdSchema,
});
export type ConditionalCase = z.infer<typeof ConditionalCaseSchema>;

export const ConditionalLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('conditional'),
  cases: z.array(ConditionalCaseSchema).min(1).max(CONDITIONAL_MAX_CASES),
  elseRootLayerId: LayerIdSchema,
  children: z.lazy(() => z.array(StackLayerSchema).min(2)) as unknown as z.ZodType<StackLayerRaw[]>,
});

type ConditionalBindingsInput = {
  cases: { id: string; expression: DecisionExpr; rootLayerId: string }[];
  elseRootLayerId: string;
  children: { id: string }[];
};

/**
 * Validates a conditional layer's branch bindings: every case (and the else)
 * must own a distinct direct child stack, and no child may be unreachable.
 * Exposed for the manifest-level walker because union members stay plain
 * `ZodObject`s. Unfinished (`empty`) case expressions are allowed while
 * drafting and gated by `validatePublishable`.
 */
export const validateConditionalCasesAndBindings = (
  data: ConditionalBindingsInput,
  ctx: z.RefinementCtx,
): void => {
  const childIds = new Set(data.children.map((c) => c.id));
  const boundRootIds = new Set<string>();
  const caseIds = new Set<string>();

  const claimRoot = (rootLayerId: string, path: (string | number)[]): void => {
    if (!childIds.has(rootLayerId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `conditional rootLayerId "${rootLayerId}" does not match any direct child stack`,
        path,
      });
      return;
    }
    if (boundRootIds.has(rootLayerId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `conditional child stack "${rootLayerId}" is bound to more than one branch`,
        path,
      });
      return;
    }
    boundRootIds.add(rootLayerId);
  };

  data.cases.forEach((c, idx) => {
    if (caseIds.has(c.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate conditional case id "${c.id}"`,
        path: ['cases', idx, 'id'],
      });
    }
    caseIds.add(c.id);
    claimRoot(c.rootLayerId, ['cases', idx, 'rootLayerId']);
  });

  claimRoot(data.elseRootLayerId, ['elseRootLayerId']);

  for (const child of data.children) {
    if (!boundRootIds.has(child.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `conditional child stack "${child.id}" is not bound to a case or the else branch`,
        path: ['children'],
      });
    }
  }
};
