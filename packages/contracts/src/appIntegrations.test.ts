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
      appsflyer: { enabled: false },
    });
  });

  it('merges partial revenuecat and appsflyer', () => {
    expect(
      parseAppIntegrations({
        revenuecat: { enabled: true, defaultOfferingId: 'off_1' },
        appsflyer: { enabled: true },
      }),
    ).toEqual({
      revenuecat: {
        enabled: true,
        defaultOfferingId: 'off_1',
        defaultPlacementId: '',
      },
      appsflyer: { enabled: true },
    });
  });

  it('defaults appsflyer when only revenuecat is present', () => {
    expect(parseAppIntegrations({ revenuecat: { enabled: true } })).toEqual({
      revenuecat: {
        enabled: true,
        defaultOfferingId: '',
        defaultPlacementId: '',
      },
      appsflyer: { enabled: false },
    });
  });

  it('defaults revenuecat when only appsflyer is present', () => {
    expect(parseAppIntegrations({ appsflyer: { enabled: true } })).toEqual({
      revenuecat: {
        enabled: false,
        defaultOfferingId: '',
        defaultPlacementId: '',
      },
      appsflyer: { enabled: true },
    });
  });
});
