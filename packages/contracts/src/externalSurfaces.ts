import { z } from 'zod';
import { FlowJumpTargetSchema } from './decisions';
import type { FlowJumpTarget } from './decisions';

export const ExternalSurfaceNodeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^surf_[a-z0-9_]+$/i, 'external surface node id must look like surf_<id>');
export type ExternalSurfaceNodeId = z.infer<typeof ExternalSurfaceNodeIdSchema>;

/** IAP / paywall-shaped outcomes (RevenueCat and future paywall providers). */
export const IAP_SURFACE_OUTCOMES = [
  'purchase_completed',
  'purchase_cancelled',
  'dismissed',
  'failed',
  'restore_completed',
] as const;

/**
 * Host-rendered headless surface outcomes. Authors wire these like paywall
 * outcomes; the SDK maps host callbacks (`onComplete` / `onBack` / `onDismiss`)
 * onto them. `failed` is reserved for SDK-side errors (missing host component).
 */
export const HEADLESS_SURFACE_OUTCOMES = ['completed', 'back', 'dismissed', 'failed'] as const;

export const NORMALIZED_SURFACE_OUTCOMES = [
  ...IAP_SURFACE_OUTCOMES,
  'completed',
  'back',
] as const;

export const NormalizedSurfaceOutcomeSchema = z.enum(NORMALIZED_SURFACE_OUTCOMES);
export type NormalizedSurfaceOutcome = z.infer<typeof NormalizedSurfaceOutcomeSchema>;

export const SurfaceProviderSchema = z.enum([
  'unspecified',
  'revenuecat',
  'superwall',
  'stripe',
  'headless',
]);
export type SurfaceProvider = z.infer<typeof SurfaceProviderSchema>;

/** Stripe Hosted Checkout outcomes (no restore path). */
export const STRIPE_SURFACE_OUTCOMES = [
  'purchase_completed',
  'purchase_cancelled',
  'dismissed',
  'failed',
] as const;

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

/**
 * Superwall surface configuration. Authors set a placement id from the
 * Superwall dashboard; Rheo does not call Superwall's REST API to validate it.
 */
export const SuperwallSurfaceConfigSchema = z.object({
  provider: z.literal('superwall'),
  placementId: z.string().min(1).max(128).optional(),
});
export type SuperwallSurfaceConfig = z.infer<typeof SuperwallSurfaceConfigSchema>;

/** Payment Link hosts the web SDK is allowed to redirect to. */
export const isStripePaymentLinkHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();
  return host === 'stripe.com' || host.endsWith('.stripe.com');
};

/**
 * Stripe Payment Link URL (`https://buy.stripe.com/…` or another `*.stripe.com` host).
 * Optional while authoring; publish refine requires a valid URL.
 */
export const StripePaymentLinkUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine((raw) => {
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && isStripePaymentLinkHost(url.hostname);
    } catch {
      return false;
    }
  }, 'Stripe Payment Link must be an https URL on buy.stripe.com or *.stripe.com');
export type StripePaymentLinkUrl = z.infer<typeof StripePaymentLinkUrlSchema>;

/**
 * Stripe Payment Link surface. No Stripe API keys on Rheo or in the host app for v1 —
 * create the link in Stripe Dashboard and paste the URL here.
 */
export const StripeSurfaceConfigSchema = z.object({
  provider: z.literal('stripe'),
  paymentLinkUrl: StripePaymentLinkUrlSchema.optional(),
});
export type StripeSurfaceConfig = z.infer<typeof StripeSurfaceConfigSchema>;

/**
 * Host-rendered headless surface. Authors optionally set `hostKey` for the
 * `externalSurfaces` registry; when omitted, the SDK looks up `node.id`.
 */
export const ExternalSurfaceHostKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_]*$/,
    'host key must start with a letter and contain only letters, digits, or underscores',
  );
export type ExternalSurfaceHostKey = z.infer<typeof ExternalSurfaceHostKeySchema>;

export const HeadlessExternalSurfaceConfigSchema = z.object({
  provider: z.literal('headless'),
  /** Registry key for `Flow` / `FlowView` `externalSurfaces`. Defaults to the node id. */
  hostKey: ExternalSurfaceHostKeySchema.optional(),
});
export type HeadlessExternalSurfaceConfig = z.infer<typeof HeadlessExternalSurfaceConfigSchema>;

/** Future providers (Adapty, etc.) extend this discriminated union. */
export const ExternalSurfaceConfigSchema = z.discriminatedUnion('provider', [
  UnspecifiedExternalSurfaceConfigSchema,
  RevenueCatSurfaceConfigSchema,
  SuperwallSurfaceConfigSchema,
  StripeSurfaceConfigSchema,
  HeadlessExternalSurfaceConfigSchema,
]);
export type ExternalSurfaceConfig = z.infer<typeof ExternalSurfaceConfigSchema>;

export const ExternalSurfaceOutcomesMapSchema = z
  .object({
    purchase_completed: FlowJumpTargetSchema.optional(),
    purchase_cancelled: FlowJumpTargetSchema.optional(),
    dismissed: FlowJumpTargetSchema.optional(),
    failed: FlowJumpTargetSchema.optional(),
    restore_completed: FlowJumpTargetSchema.optional(),
    completed: FlowJumpTargetSchema.optional(),
    back: FlowJumpTargetSchema.optional(),
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

/**
 * Key used to look up a host component in `externalSurfaces`.
 * Headless nodes may override via `config.hostKey`; otherwise the node id.
 */
export const resolveExternalSurfaceHostKey = (node: ExternalSurfaceNode): string => {
  if (node.config.provider === 'headless' && node.config.hostKey) {
    return node.config.hostKey;
  }
  return node.id;
};

/** Pick the configured target for an outcome, falling back to the explicit fallback edge. */
export const resolveExternalSurfaceTarget = (
  node: ExternalSurfaceNode,
  outcome: NormalizedSurfaceOutcome,
): FlowJumpTarget => node.outcomes[outcome] ?? node.fallback;

/** Canvas / inspector outcome handles for a given provider (excludes fallback). */
export const surfaceOutcomesForProvider = (
  provider: SurfaceProvider,
): readonly NormalizedSurfaceOutcome[] => {
  switch (provider) {
    case 'revenuecat':
    case 'superwall':
      return IAP_SURFACE_OUTCOMES;
    case 'stripe':
      return STRIPE_SURFACE_OUTCOMES;
    case 'headless':
      return HEADLESS_SURFACE_OUTCOMES;
    case 'unspecified':
      return [];
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
};
