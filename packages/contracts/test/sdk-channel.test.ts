import { describe, expect, it } from 'vitest';
import { EMPTY_BRANDING } from '../src/branding';
import { validFlow } from '../src/__fixtures__/validFlow';
import { SdkCodeChannelEventSchema } from '../src/codeChannelEvents';
import { SdkResolveResponseSchema } from '../src/sdk';
import {
  SdkCodeResolveResponseSchema,
  codeResolveEtag,
  parseSdkResolveAllResponse,
} from '../src/sdkChannel';

const integrations = {
  revenuecat: { enabled: false, defaultOfferingId: '', defaultPlacementId: '' },
  superwall: { enabled: false, defaultPlacementId: '' },
  appsflyer: { enabled: false },
  stripe: { enabled: false },
};

describe('channel resolve contracts', () => {
  it('parses a flow body and a code body', () => {
    const manifest = validFlow();
    const flow = SdkResolveResponseSchema.parse({
      kind: 'flow',
      flowId: manifest.flowId,
      versionId: '22222222-2222-4222-8222-222222222222',
      versionNumber: 1,
      assignmentVersion: 4,
      environment: 'live',
      channelId: 'ch_welcome',
      experimentId: null,
      variantId: null,
      experiment: null,
      manifest,
      mediaMap: {},
      branding: EMPTY_BRANDING,
      integrations,
    });
    expect(flow.kind).toBe('flow');

    const code = SdkCodeResolveResponseSchema.parse({
      kind: 'code',
      channelId: 'ch_paywall',
      environment: 'test',
      assignmentVersion: 2,
      experiment: {
        id: '11111111-1111-4111-8111-111111111111',
        variantKey: 'treatment',
        variantId: '33333333-3333-4333-8333-333333333333',
      },
      variantKey: 'treatment',
      parameters: { enabled: true, headline: 'Hello', extra: null },
    });
    expect(code.variantKey).toBe(code.experiment?.variantKey);
    expect(codeResolveEtag(2, 'treatment', code.parameters)).toMatch(/^"2-treatment-[0-9a-f]{12}"$/);
  });

  it('drops unknown kinds from a batch', () => {
    const parsed = parseSdkResolveAllResponse({
      channels: [{ kind: 'layers', channelId: 'ch_x' }, { kind: 'code' }],
    });
    expect(parsed.channels).toEqual([]);
  });

  it('parses a code event', () => {
    const event = SdkCodeChannelEventSchema.parse({
      eventId: '44444444-4444-4444-8444-444444444444',
      name: 'experiment_exposed',
      timestamp: '2026-10-02T00:00:00.000Z',
      experimentId: '11111111-1111-4111-8111-111111111111',
      variantId: '33333333-3333-4333-8333-333333333333',
      identity: { appUserId: 'user_1' },
    });
    expect(event.name).toBe('experiment_exposed');
  });
});
