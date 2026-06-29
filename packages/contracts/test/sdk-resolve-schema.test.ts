import { describe, expect, it } from 'vitest';
import { EMPTY_BRANDING } from '../src/branding';
import { validFlow } from '../src/__fixtures__/validFlow';
import { SdkResolveResponseSchema } from '../src/sdk';

describe('SdkResolveResponseSchema', () => {
  it('parses resolve payload with branding from @getrheo/contracts/branding', () => {
    const manifest = validFlow();
    const parsed = SdkResolveResponseSchema.safeParse({
      flowId: manifest.flowId,
      versionId: '22222222-2222-4222-8222-222222222222',
      versionNumber: 1,
      assignmentVersion: 1,
      environment: 'test',
      channelId: 'welcome',
      experimentId: null,
      variantId: null,
      manifest,
      mediaMap: {},
      branding: EMPTY_BRANDING,
      features: { attribution: true },
      integrations: {
        revenuecat: { enabled: false, defaultOfferingId: '', defaultPlacementId: '' },
        appsflyer: { enabled: false },
      },
    });
    expect(parsed.success).toBe(true);
  });
});
