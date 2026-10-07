import { describe, expect, it } from 'vitest';
import { classifyManifestCapabilities } from './manifestCapabilities.js';
import type { FlowManifest } from './manifest.js';

const baseManifest = (): Pick<FlowManifest, 'screens' | 'externalSurfaceNodes'> => ({
  screens: [
    {
      id: 'scr_a',
      name: 'A',
      regions: {
        body: {
          id: 'ly_root',
          kind: 'stack',
          direction: 'vertical',
          children: [],
        },
      },
      next: { default: null },
    },
  ],
  externalSurfaceNodes: [],
});

describe('classifyManifestCapabilities', () => {
  it('reports no findings for a plain screen flow', () => {
    const report = classifyManifestCapabilities(baseManifest());
    expect(report.findings).toEqual([]);
    expect(report.hasMobileOnly).toBe(false);
    expect(report.hasWebOnly).toBe(false);
  });

  it('flags stripe as web-only and revenuecat as mobile-only', () => {
    const m = baseManifest();
    m.externalSurfaceNodes = [
      {
        id: 'surf_pay',
        config: { provider: 'stripe', paymentLinkUrl: 'https://buy.stripe.com/test_abc' },
        outcomes: {},
        fallback: 'scr_a',
      },
      {
        id: 'surf_rc',
        config: { provider: 'revenuecat' },
        outcomes: {},
        fallback: 'scr_a',
      },
    ];
    const report = classifyManifestCapabilities(m);
    expect(report.hasWebOnly).toBe(true);
    expect(report.hasMobileOnly).toBe(true);
    expect(report.findings.map((f) => f.code).sort()).toEqual([
      'surface:revenuecat',
      'surface:stripe',
    ]);
  });

  it('flags OS permission and app review button actions as mobile-only', () => {
    const m = baseManifest();
    m.screens[0]!.regions.body = {
      id: 'ly_root',
      kind: 'stack',
      direction: 'vertical',
      children: [
        {
          id: 'ly_perm',
          kind: 'button',
          variant: 'primary',
          action: {
            kind: 'request_os_permission',
            permissionKey: 'notifications',
            outcomes: { granted: 'continue', denied: 'continue', blocked: 'continue' },
          },
          children: [{ id: 'ly_perm_t', kind: 'text', text: { default: 'Allow' } }],
        },
        {
          id: 'ly_review',
          kind: 'button',
          variant: 'secondary',
          action: { kind: 'request_app_review' },
          children: [{ id: 'ly_review_t', kind: 'text', text: { default: 'Rate' } }],
        },
      ],
    };
    const report = classifyManifestCapabilities(m);
    expect(report.hasMobileOnly).toBe(true);
    expect(report.hasWebOnly).toBe(false);
    expect(report.findings.map((f) => f.code).sort()).toEqual([
      'action:request_app_review',
      'action:request_os_permission',
    ]);
  });
});
