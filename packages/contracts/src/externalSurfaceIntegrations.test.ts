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
      }),
    ).toEqual(['headless', 'revenuecat']);
  });

  it('labels headless and builds config', () => {
    expect(externalSurfaceProviderLabel('headless')).toMatch(/Headless/i);
    expect(createExternalSurfaceConfig('headless')).toEqual({ provider: 'headless' });
    expect(createExternalSurfaceConfig('headless', { hostKey: 'onboardingQuiz' })).toEqual({
      provider: 'headless',
      hostKey: 'onboardingQuiz',
    });
  });
});
