import { z } from 'zod';
import { FlowJumpTargetSchema } from './decisions';
import type { FlowJumpTarget } from './decisions';

export const ExternalSurfaceNodeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^surf_[a-z0-9_]+$/i, 'external surface node id must look like surf_<id>');
export type ExternalSurfaceNodeId = z.infer<typeof ExternalSurfaceNodeIdSchema>;

export const NORMALIZED_SURFACE_OUTCOMES = [
  'purchase_completed',
  'purchase_cancelled',
  'dismissed',
  'failed',
  'restore_completed',
] as const;

export const NormalizedSurfaceOutcomeSchema = z.enum(NORMALIZED_SURFACE_OUTCOMES);
export type NormalizedSurfaceOutcome = z.infer<typeof NormalizedSurfaceOutcomeSchema>;

export const SurfaceProviderSchema = z.enum(['unspecified', 'revenuecat']);
export type SurfaceProvider = z.infer<typeof SurfaceProviderSchema>;

/** Authoring-only: integration not chosen yet in the flow editor. Resolves like a failed surface at runtime until changed. */
export const UnspecifiedExternalSurfaceConfigSchema = z.object({
  provider: z.literal('unspecified'),
});
export type UnspecifiedExternalSurfaceConfig = z.infer<typeof UnspecifiedExternalSurfaceConfigSchema>;

export const RevenueCatSurfacePresentationSchema = z.enum(['paywall', 'paywall_if_needed']);
export type RevenueCatSurfacePresentation = z.infer<typeof RevenueCatSurfacePresentationSchema>;

/**
 * RevenueCat surface configuration. The builder stores these as free text;
 * Rheo does not call RevenueCat's REST API to validate them.
 */
export const RevenueCatSurfaceConfigSchema = z.object({
  provider: z.literal('revenuecat'),
  offeringId: z.string().min(1).max(128).optional(),
  placementId: z.string().min(1).max(128).optional(),
  presentation: RevenueCatSurfacePresentationSchema.optional(),
});
export type RevenueCatSurfaceConfig = z.infer<typeof RevenueCatSurfaceConfigSchema>;

/** Future providers (Superwall, etc.) extend this discriminated union. */
export const ExternalSurfaceConfigSchema = z.discriminatedUnion('provider', [
  UnspecifiedExternalSurfaceConfigSchema,
  RevenueCatSurfaceConfigSchema,
]);
export type ExternalSurfaceConfig = z.infer<typeof ExternalSurfaceConfigSchema>;

export const ExternalSurfaceOutcomesMapSchema = z
  .object({
    purchase_completed: FlowJumpTargetSchema.optional(),
    purchase_cancelled: FlowJumpTargetSchema.optional(),
    dismissed: FlowJumpTargetSchema.optional(),
    failed: FlowJumpTargetSchema.optional(),
    restore_completed: FlowJumpTargetSchema.optional(),
  })
  .strict();
export type ExternalSurfaceOutcomesMap = z.infer<typeof ExternalSurfaceOutcomesMapSchema>;

export const ExternalSurfaceNodeSchema = z.object({
  id: ExternalSurfaceNodeIdSchema,
  name: z.string().min(1).max(80).optional(),
  config: ExternalSurfaceConfigSchema,
  /** Per-outcome jump targets. Outcomes not listed here fall through to `fallback`. */
  outcomes: ExternalSurfaceOutcomesMapSchema,
  /** Required: used for any outcome not in `outcomes` (e.g. provider quirks, unmapped events). */
  fallback: FlowJumpTargetSchema,
});
export type ExternalSurfaceNode = z.infer<typeof ExternalSurfaceNodeSchema>;

/** Pick the configured target for an outcome, falling back to the explicit fallback edge. */
export const resolveExternalSurfaceTarget = (
  node: ExternalSurfaceNode,
  outcome: NormalizedSurfaceOutcome,
): FlowJumpTarget => node.outcomes[outcome] ?? node.fallback;
