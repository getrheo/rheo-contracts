import type { ResolvedAppIntegrations } from './appIntegrations';
import type {
  ExternalSurfaceConfig,
  RevenueCatSurfacePresentation,
  SurfaceProvider,
} from './externalSurfaces';

/** Enabled app integrations / always-on providers that can be chosen for a surface step (excludes `unspecified`). */
export type ExternalSurfaceIntegrationProvider = Exclude<SurfaceProvider, 'unspecified'>;

/**
 * Integration Node providers (excludes headless External Surface Nodes).
 * Stripe, RevenueCat, and Superwall each require an App Settings toggle.
 */
export type PartnerSurfaceProvider = Exclude<ExternalSurfaceIntegrationProvider, 'headless'>;

/** Partner providers that require an App Settings integration toggle. */
export type ToggleGatedPartnerSurfaceProvider = PartnerSurfaceProvider;

/**
 * Partner providers available for an Integration Node.
 * Each provider requires the matching app integration to be enabled.
 */
export const listEnabledPartnerSurfaceProviders = (
  integrations: ResolvedAppIntegrations,
): PartnerSurfaceProvider[] => {
  const out: PartnerSurfaceProvider[] = [];
  if (integrations.stripe.enabled) out.push('stripe');
  if (integrations.revenuecat.enabled) out.push('revenuecat');
  if (integrations.superwall.enabled) out.push('superwall');
  return out;
};

/** Always-on headless provider for External Surface Nodes (no App Settings toggle). */
export const listHeadlessSurfaceProviders = (): Extract<
  ExternalSurfaceIntegrationProvider,
  'headless'
>[] => ['headless'];

/**
 * All providers available across Integration + External Surface nodes.
 * Prefer `listEnabledPartnerSurfaceProviders` / `listHeadlessSurfaceProviders` at call sites.
 */
export const listEnabledExternalSurfaceProviders = (
  integrations: ResolvedAppIntegrations,
): ExternalSurfaceIntegrationProvider[] => [
  ...listHeadlessSurfaceProviders(),
  ...listEnabledPartnerSurfaceProviders(integrations),
];

export const externalSurfaceProviderLabel = (provider: SurfaceProvider): string => {
  switch (provider) {
    case 'unspecified':
      return 'Not selected';
    case 'revenuecat':
      return 'RevenueCat';
    case 'superwall':
      return 'Superwall';
    case 'stripe':
      return 'Stripe';
    case 'headless':
      return 'Headless (custom UI)';
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
};

export const externalSurfaceProviderMenuDescription = (
  provider: ExternalSurfaceIntegrationProvider,
): string => {
  switch (provider) {
    case 'revenuecat':
      return 'Present the host RevenueCat paywall and branch on purchase, restore, dismiss, or failure.';
    case 'superwall':
      return 'Register a Superwall placement and branch on purchase, restore, dismiss, skip, or failure.';
    case 'stripe':
      return 'Redirect to a Stripe Payment Link; branch on purchase, cancel, dismiss, or failure.';
    case 'headless':
      return 'Render a host-provided component keyed by host key (or node id); branch on complete, back, or dismiss.';
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
};

export type CreateExternalSurfaceConfigOptions = {
  offeringId?: string;
  placementId?: string;
  presentation?: RevenueCatSurfacePresentation;
  hostKey?: string;
  paymentLinkUrl?: string;
};

/** Build manifest `config` for a surface provider (extend the switch as new providers ship). */
export const createExternalSurfaceConfig = (
  provider: SurfaceProvider,
  options?: CreateExternalSurfaceConfigOptions,
): ExternalSurfaceConfig => {
  switch (provider) {
    case 'unspecified':
      return { provider: 'unspecified' };
    case 'headless':
      return {
        provider: 'headless',
        ...(options?.hostKey ? { hostKey: options.hostKey } : {}),
      };
    case 'revenuecat':
      return {
        provider: 'revenuecat',
        ...(options?.offeringId ? { offeringId: options.offeringId } : {}),
        ...(options?.placementId ? { placementId: options.placementId } : {}),
        ...(options?.presentation ? { presentation: options.presentation } : {}),
      };
    case 'superwall':
      return {
        provider: 'superwall',
        ...(options?.placementId ? { placementId: options.placementId } : {}),
      };
    case 'stripe':
      return {
        provider: 'stripe',
        ...(options?.paymentLinkUrl ? { paymentLinkUrl: options.paymentLinkUrl } : {}),
      };
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
};
