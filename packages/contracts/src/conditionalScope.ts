import { collectDecisionFieldKeys } from './decisionExpr.js';
import { isInputLayer, layerChildren } from './layers.js';
import type { ConditionalLayer, Layer } from './layers.js';
import { walkScreenLayers } from './screens.js';
import type { Screen } from './screens.js';

/**
 * Highest number of layers matching `match` that can be visible at once.
 * Conditional branches are mutually exclusive, so they contribute their
 * largest branch instead of the sum of all branches.
 */
export const maxMatchesOnActivePath = (root: Layer, match: (l: Layer) => boolean): number => {
  const self = match(root) ? 1 : 0;
  if (root.kind === 'conditional') {
    let widest = 0;
    for (const branch of root.children) {
      widest = Math.max(widest, maxMatchesOnActivePath(branch, match));
    }
    return self + widest;
  }
  let total = 0;
  for (const child of layerChildren(root)) {
    total += maxMatchesOnActivePath(child, match);
  }
  return self + total;
};

type VisibleWithResult = { hasTarget: boolean; count: number };

/**
 * Highest number of layers matching `match` that can be visible at the same
 * time as `targetLayerId` (typically an insertion parent). Conditional branches
 * that do not contain the target contribute their widest branch; the branch
 * holding the target contributes only itself, since sibling branches can never
 * render together with it.
 */
export const maxMatchesVisibleWithLayer = (
  root: Layer,
  targetLayerId: string,
  match: (l: Layer) => boolean,
): VisibleWithResult => {
  const self = match(root) ? 1 : 0;
  const isTarget = root.id === targetLayerId;
  if (root.kind === 'conditional') {
    // Adding into the conditional itself means a new branch, exclusive with all
    // existing branches.
    if (isTarget) return { hasTarget: true, count: self };
    const branches = root.children.map((b) => maxMatchesVisibleWithLayer(b, targetLayerId, match));
    const withTarget = branches.find((b) => b.hasTarget);
    if (withTarget) return { hasTarget: true, count: self + withTarget.count };
    return {
      hasTarget: false,
      count: self + branches.reduce((widest, b) => Math.max(widest, b.count), 0),
    };
  }
  let count = self;
  let hasTarget = isTarget;
  for (const child of layerChildren(root)) {
    const result = maxMatchesVisibleWithLayer(child, targetLayerId, match);
    count += result.count;
    if (result.hasTarget) hasTarget = true;
  }
  return { hasTarget, count };
};

/** Same as {@link maxMatchesVisibleWithLayer} across a screen's regions. */
export const maxMatchesVisibleWithLayerOnScreen = (
  screen: Screen,
  targetLayerId: string,
  match: (l: Layer) => boolean,
): number => {
  const { header, body, footer } = screen.regions;
  return (
    (header ? maxMatchesVisibleWithLayer(header, targetLayerId, match).count : 0) +
    maxMatchesVisibleWithLayer(body, targetLayerId, match).count +
    (footer ? maxMatchesVisibleWithLayer(footer, targetLayerId, match).count : 0)
  );
};

/** Same as {@link maxMatchesOnActivePath} across a screen's regions. */
export const maxMatchesOnScreenActivePath = (
  screen: Screen,
  match: (l: Layer) => boolean,
): number => {
  const { header, body, footer } = screen.regions;
  return (
    (header ? maxMatchesOnActivePath(header, match) : 0) +
    maxMatchesOnActivePath(body, match) +
    (footer ? maxMatchesOnActivePath(footer, match) : 0)
  );
};

/** Layers that capture an answer under a field key on the screen they live on. */
const answerFieldKeyOf = (l: Layer): string | null => {
  if (isInputLayer(l)) return l.fieldKey;
  if (l.kind === 'checkbox') return l.fieldKey;
  if (l.kind === 'email_password_auth') return l.fieldKey;
  return null;
};

/**
 * Same-screen field keys a conditional may not read: those whose capture layer
 * is declared at or after the conditional in tree order (including fields
 * inside the conditional's own branches). Fields from upstream screens are
 * always readable and never listed here.
 */
export const conditionalBlockedFieldKeys = (screen: Screen, conditionalId: string): string[] => {
  const fieldOrderOnScreen = new Map<string, number>();
  let conditionalOrder: number | null = null;
  let order = 0;
  walkScreenLayers(screen, (l) => {
    const fieldKey = answerFieldKeyOf(l);
    if (fieldKey != null && !fieldOrderOnScreen.has(fieldKey)) {
      fieldOrderOnScreen.set(fieldKey, order);
    }
    if (l.id === conditionalId) conditionalOrder = order;
    order += 1;
  });
  if (conditionalOrder === null) return [];
  const cutoff: number = conditionalOrder;
  return [...fieldOrderOnScreen.entries()]
    .filter(([, at]) => at >= cutoff)
    .map(([fieldKey]) => fieldKey);
};

export type ConditionalFieldScopeViolation = {
  conditionalId: string;
  caseId: string;
  caseIndex: number;
  fieldKey: string;
};

/**
 * Conditional cases may only read fields answered before them: fields from
 * upstream screens, or same-screen fields whose capture layer precedes the
 * conditional in tree order. Returns same-screen ordering violations (fields
 * declared at or after the conditional, including inside its own branches).
 */
export const conditionalFieldScopeViolations = (
  screen: Screen,
): ConditionalFieldScopeViolation[] => {
  const fieldOrderOnScreen = new Map<string, number>();
  const conditionals: { layer: ConditionalLayer; order: number }[] = [];
  let order = 0;
  walkScreenLayers(screen, (l) => {
    const fieldKey = answerFieldKeyOf(l);
    if (fieldKey != null && !fieldOrderOnScreen.has(fieldKey)) {
      fieldOrderOnScreen.set(fieldKey, order);
    }
    if (l.kind === 'conditional') conditionals.push({ layer: l, order });
    order += 1;
  });

  const violations: ConditionalFieldScopeViolation[] = [];
  for (const { layer, order: conditionalOrder } of conditionals) {
    layer.cases.forEach((c, caseIndex) => {
      for (const fieldKey of collectDecisionFieldKeys(c.expression)) {
        const declaredAt = fieldOrderOnScreen.get(fieldKey);
        if (declaredAt === undefined) continue;
        if (declaredAt >= conditionalOrder) {
          violations.push({ conditionalId: layer.id, caseId: c.id, caseIndex, fieldKey });
        }
      }
    });
  }
  return violations;
};
