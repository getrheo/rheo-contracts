import type { ResolvedAppIntegrations } from './appIntegrations';
import type {
  ExternalSurfaceConfig,
  RevenueCatSurfacePresentation,
  SurfaceProvider,
} from './externalSurfaces';

/** Enabled app integrations that can be chosen for an external integration step (excludes `unspecified`). */
export type ExternalSurfaceIntegrationProvider = Exclude<SurfaceProvider, 'unspecified'>;

/** App integrations that are turned on and may power an external integration canvas step. */
export const listEnabledExternalSurfaceProviders = (
  integrations: ResolvedAppIntegrations,
): ExternalSurfaceIntegrationProvider[] => {
  const out: ExternalSurfaceIntegrationProvider[] = [];
  if (integrations.revenuecat.enabled) out.push('revenuecat');
  return out;
};

export const externalSurfaceProviderLabel = (provider: SurfaceProvider): string => {
  switch (provider) {
    case 'unspecified':
      return 'Not selected';
    case 'revenuecat':
      return 'RevenueCat';
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
};

/** Build manifest `config` for a surface provider (extend the switch as new providers ship). */
export const createExternalSurfaceConfig = (
  provider: SurfaceProvider,
  options?: CreateExternalSurfaceConfigOptions,
): ExternalSurfaceConfig => {
  switch (provider) {
    case 'unspecified':
      return { provider: 'unspecified' };
    case 'revenuecat':
      return {
        provider: 'revenuecat',
        ...(options?.offeringId ? { offeringId: options.offeringId } : {}),
        ...(options?.placementId ? { placementId: options.placementId } : {}),
        ...(options?.presentation ? { presentation: options.presentation } : {}),
      };
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
};
