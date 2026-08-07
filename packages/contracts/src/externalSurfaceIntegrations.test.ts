import { describe, expect, it } from 'vitest';
import { APP_INTEGRATIONS_DEFAULTS } from './appIntegrations.js';
import {
  createExternalSurfaceConfig,
  externalSurfaceProviderLabel,
  listEnabledExternalSurfaceProviders,
  listEnabledPartnerSurfaceProviders,
  listHeadlessSurfaceProviders,
} from './externalSurfaceIntegrations.js';

describe('externalSurfaceIntegrations', () => {
  it('lists partner providers only when enabled', () => {
    expect(listEnabledPartnerSurfaceProviders(APP_INTEGRATIONS_DEFAULTS)).toEqual([]);
    expect(
      listEnabledPartnerSurfaceProviders({
        ...APP_INTEGRATIONS_DEFAULTS,
        revenuecat: { ...APP_INTEGRATIONS_DEFAULTS.revenuecat, enabled: true },
      }),
    ).toEqual(['revenuecat']);
    expect(
      listEnabledPartnerSurfaceProviders({
        ...APP_INTEGRATIONS_DEFAULTS,
        superwall: { ...APP_INTEGRATIONS_DEFAULTS.superwall, enabled: true },
      }),
    ).toEqual(['superwall']);
  });

  it('always lists headless independently of app integrations', () => {
    expect(listHeadlessSurfaceProviders()).toEqual(['headless']);
  });

  it('union helper includes headless then partners', () => {
    expect(listEnabledExternalSurfaceProviders(APP_INTEGRATIONS_DEFAULTS)).toEqual(['headless']);
    expect(
      listEnabledExternalSurfaceProviders({
        ...APP_INTEGRATIONS_DEFAULTS,
        revenuecat: { ...APP_INTEGRATIONS_DEFAULTS.revenuecat, enabled: true },
        superwall: { ...APP_INTEGRATIONS_DEFAULTS.superwall, enabled: true },
      }),
    ).toEqual(['headless', 'revenuecat', 'superwall']);
  });

  it('labels partners and builds config', () => {
    expect(externalSurfaceProviderLabel('headless')).toMatch(/Headless/i);
    expect(externalSurfaceProviderLabel('superwall')).toBe('Superwall');
    expect(createExternalSurfaceConfig('headless')).toEqual({ provider: 'headless' });
    expect(createExternalSurfaceConfig('headless', { hostKey: 'onboardingQuiz' })).toEqual({
      provider: 'headless',
      hostKey: 'onboardingQuiz',
    });
    expect(createExternalSurfaceConfig('superwall', { placementId: 'campaign_trigger' })).toEqual({
      provider: 'superwall',
      placementId: 'campaign_trigger',
    });
  });
});
