import type { FlowManifest } from './manifest.js';
import type { Layer } from './layers.js';
import { walkScreenLayers } from './screens.js';
import type { Screen } from './screens.js';
import type { SurfaceProvider } from './externalSurfaces.js';

/** Runtime capability classes used for channel-pin warnings (not flow types). */
export type ManifestCapabilityKind = 'mobile_only' | 'web_only';

export type ManifestCapabilityFinding = {
  kind: ManifestCapabilityKind;
  /** Stable machine id for tests / analytics (e.g. `surface:stripe`, `action:request_os_permission`). */
  code: string;
  /** Human-readable label for dashboard copy. */
  label: string;
  /** Manifest node or layer id when known. */
  nodeId?: string;
};

export type ManifestCapabilityReport = {
  findings: ManifestCapabilityFinding[];
  hasMobileOnly: boolean;
  hasWebOnly: boolean;
};

const MOBILE_ONLY_SURFACE_PROVIDERS = new Set<SurfaceProvider>(['revenuecat', 'superwall']);
const WEB_ONLY_SURFACE_PROVIDERS = new Set<SurfaceProvider>(['stripe']);

const surfaceLabel = (provider: SurfaceProvider): string => {
  switch (provider) {
    case 'revenuecat':
      return 'RevenueCat paywall';
    case 'superwall':
      return 'Superwall paywall';
    case 'stripe':
      return 'Stripe Payment Link';
    case 'headless':
      return 'Headless surface';
    case 'unspecified':
      return 'Unspecified integration';
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
};

/**
 * Scan a flow manifest for nodes that only work on mobile or only on web.
 * Used for non-blocking channel pin warnings — does not create separate flow types.
 */
export const classifyManifestCapabilities = (
  manifest: Pick<FlowManifest, 'screens' | 'externalSurfaceNodes'>,
): ManifestCapabilityReport => {
  const findings: ManifestCapabilityFinding[] = [];

  for (const surface of manifest.externalSurfaceNodes ?? []) {
    const provider = surface.config.provider;
    if (MOBILE_ONLY_SURFACE_PROVIDERS.has(provider)) {
      findings.push({
        kind: 'mobile_only',
        code: `surface:${provider}`,
        label: surfaceLabel(provider),
        nodeId: surface.id,
      });
    }
    if (WEB_ONLY_SURFACE_PROVIDERS.has(provider)) {
      findings.push({
        kind: 'web_only',
        code: `surface:${provider}`,
        label: surfaceLabel(provider),
        nodeId: surface.id,
      });
    }
  }

  for (const screen of manifest.screens) {
    walkScreenLayers(screen as Screen, (layer: Layer) => {
      if (layer.kind !== 'button') return;
      if (layer.action.kind === 'request_os_permission') {
        findings.push({
          kind: 'mobile_only',
          code: 'action:request_os_permission',
          label: 'Request OS permission',
          nodeId: layer.id,
        });
      }
      if (layer.action.kind === 'request_app_review') {
        findings.push({
          kind: 'mobile_only',
          code: 'action:request_app_review',
          label: 'Request app review',
          nodeId: layer.id,
        });
      }
    });
  }

  return {
    findings,
    hasMobileOnly: findings.some((f) => f.kind === 'mobile_only'),
    hasWebOnly: findings.some((f) => f.kind === 'web_only'),
  };
};
