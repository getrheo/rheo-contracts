import { describe, expect, it } from 'vitest';

import { parseAppIntegrations } from './appIntegrations';

describe('parseAppIntegrations', () => {
  it('returns defaults for null/undefined', () => {
    expect(parseAppIntegrations(null)).toEqual({
      revenuecat: {
        enabled: false,
        defaultOfferingId: '',
        defaultPlacementId: '',
      },
      superwall: {
        enabled: false,
        defaultPlacementId: '',
      },
      appsflyer: { enabled: false },
    });
  });

  it('merges partial revenuecat, superwall, and appsflyer', () => {
    expect(
      parseAppIntegrations({
        revenuecat: { enabled: true, defaultOfferingId: 'off_1' },
        superwall: { enabled: true, defaultPlacementId: 'campaign_trigger' },
        appsflyer: { enabled: true },
      }),
    ).toEqual({
      revenuecat: {
        enabled: true,
        defaultOfferingId: 'off_1',
        defaultPlacementId: '',
      },
      superwall: {
        enabled: true,
        defaultPlacementId: 'campaign_trigger',
      },
      appsflyer: { enabled: true },
    });
  });

  it('defaults appsflyer and superwall when only revenuecat is present', () => {
    expect(parseAppIntegrations({ revenuecat: { enabled: true } })).toEqual({
      revenuecat: {
        enabled: true,
        defaultOfferingId: '',
        defaultPlacementId: '',
      },
      superwall: {
        enabled: false,
        defaultPlacementId: '',
      },
      appsflyer: { enabled: false },
    });
  });

  it('defaults revenuecat and superwall when only appsflyer is present', () => {
    expect(parseAppIntegrations({ appsflyer: { enabled: true } })).toEqual({
      revenuecat: {
        enabled: false,
        defaultOfferingId: '',
        defaultPlacementId: '',
      },
      superwall: {
        enabled: false,
        defaultPlacementId: '',
      },
      appsflyer: { enabled: true },
    });
  });

  it('defaults revenuecat and appsflyer when only superwall is present', () => {
    expect(parseAppIntegrations({ superwall: { enabled: true } })).toEqual({
      revenuecat: {
        enabled: false,
        defaultOfferingId: '',
        defaultPlacementId: '',
      },
      superwall: {
        enabled: true,
        defaultPlacementId: '',
      },
      appsflyer: { enabled: false },
    });
  });
});
