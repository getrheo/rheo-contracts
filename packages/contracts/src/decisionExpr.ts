import { z } from 'zod';

/**
 * Predicate AST shared by decision nodes (graph routing) and conditional
 * layers (in-screen rendering). Kept free of layer/screen imports so both
 * can depend on it without a module cycle.
 */

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

/** True when the expression has at least one predicate (i.e. can ever match). */
export const decisionExprHasPredicate = (expr: DecisionExpr): boolean => {
  if (expr.kind === 'empty') return false;
  if (expr.kind === 'predicate') return true;
  return expr.children.some(decisionExprHasPredicate);
};
