import { z } from 'zod';
import { ScreenIdSchema } from './layers';

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

export const DecisionBuiltinNameSchema = z.enum(['locale', 'platform']);
export type DecisionBuiltinName = z.infer<typeof DecisionBuiltinNameSchema>;

export const DecisionVariableRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('builtin'), name: DecisionBuiltinNameSchema }),
  z.object({ kind: z.literal('sdk'), key: z.string().min(1).max(128) }),
  z.object({ kind: z.literal('field'), fieldKey: z.string().min(1).max(128) }),
]);
export type DecisionVariableRef = z.infer<typeof DecisionVariableRefSchema>;

export const DecisionStringPredicateSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('eq'), value: z.string() }),
  z.object({ op: z.literal('neq'), value: z.string() }),
  z.object({ op: z.literal('contains'), value: z.string() }),
]);

export const DecisionNumberPredicateSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('eq'), value: z.number() }),
  z.object({ op: z.literal('neq'), value: z.number() }),
  z.object({ op: z.literal('lt'), value: z.number() }),
  z.object({ op: z.literal('lte'), value: z.number() }),
  z.object({ op: z.literal('gt'), value: z.number() }),
  z.object({ op: z.literal('gte'), value: z.number() }),
]);

export const DecisionChoicePredicateSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('eq'), optionId: z.string().min(1) }),
  z.object({ op: z.literal('one_of'), optionIds: z.array(z.string().min(1)).min(1) }),
]);

export const DecisionMultiPredicateSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('intersects'),
    optionIds: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    op: z.literal('contains_all'),
    optionIds: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    op: z.literal('subset_of'),
    optionIds: z.array(z.string().min(1)).min(1),
  }),
]);

export const DecisionBooleanPredicateSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('eq'), value: z.boolean() }),
  z.object({ op: z.literal('neq'), value: z.boolean() }),
]);

export const DecisionPredicatePayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('string'), pred: DecisionStringPredicateSchema }),
  z.object({ type: z.literal('number'), pred: DecisionNumberPredicateSchema }),
  z.object({ type: z.literal('boolean'), pred: DecisionBooleanPredicateSchema }),
  z.object({ type: z.literal('choice'), pred: DecisionChoicePredicateSchema }),
  z.object({ type: z.literal('multi'), pred: DecisionMultiPredicateSchema }),
]);
export type DecisionPredicatePayload = z.infer<typeof DecisionPredicatePayloadSchema>;

export type DecisionExpr =
  | { kind: 'empty' }
  | { kind: 'group'; op: 'and' | 'or'; children: DecisionExpr[] }
  | {
      kind: 'predicate';
      variable: DecisionVariableRef;
      predicate: DecisionPredicatePayload;
    };

export const DecisionExprSchema: z.ZodType<DecisionExpr> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('empty') }),
    z.object({
      kind: z.literal('group'),
      op: z.enum(['and', 'or']),
      children: z.array(DecisionExprSchema).min(1),
    }),
    z.object({
      kind: z.literal('predicate'),
      variable: DecisionVariableRefSchema,
      predicate: DecisionPredicatePayloadSchema,
    }),
  ]),
);

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

export const collectDecisionSdkKeys = (expr: DecisionExpr): string[] => {
  const out: string[] = [];
  const walk = (e: DecisionExpr): void => {
    if (e.kind === 'empty') return;
    if (e.kind === 'predicate') {
      if (e.variable.kind === 'sdk') out.push(e.variable.key);
      return;
    }
    for (const c of e.children) walk(c);
  };
  walk(expr);
  return out;
};

export const collectDecisionFieldKeys = (expr: DecisionExpr): string[] => {
  const out: string[] = [];
  const walk = (e: DecisionExpr): void => {
    if (e.kind === 'empty') return;
    if (e.kind === 'predicate') {
      if (e.variable.kind === 'field') out.push(e.variable.fieldKey);
      return;
    }
    for (const c of e.children) walk(c);
  };
  walk(expr);
  return out;
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
