import type { DecisionExpr } from '../../decisionExpr.js';
import type { RestingMotion, RestingMotionEntry } from '../restingMotion.js';
import type { StackLayerRaw } from './layout.js';

/** One ordered branch evaluated before {@link ConditionalLayerRaw.elseRootLayerId}. */
export type ConditionalCaseRaw = {
  id: string;
  /** Display label in the editor (e.g. “iOS users”). */
  name?: string;
  expression: DecisionExpr;
  /** Id of the child stack rendered when this case is the first match. */
  rootLayerId: string;
};

/**
 * Control-flow container: renders exactly one child stack — the first case
 * whose expression matches, otherwise the else stack. Inactive branches are
 * absent from the rendered tree, so their inputs never submit. Layout and
 * spacing belong on the branch stacks, not here.
 */
export type ConditionalLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'conditional';
  cases: ConditionalCaseRaw[];
  /** Id of the catch-all child stack; always present (may render nothing). */
  elseRootLayerId: string;
  /** Every case stack plus the else stack. */
  children: StackLayerRaw[];
};
