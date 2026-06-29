import { describe, expect, it } from 'vitest';
import { FlowManifestSchema, MANIFEST_SCHEMA_VERSION } from './manifest';
import type { FlowManifest } from './manifest';
import type { StackLayer } from './layers';
import {
  collectCanvasGateViolations,
  describeCanvasGatesForAi,
  manifestPassesCanvasGates,
  parseCanvasEditorGates,
} from './canvasEditorGates';

const manifestWithBodyChildren = (
  bodyChildren: StackLayer['children'],
): FlowManifest => {
  return FlowManifestSchema.parse({
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    flowId: '00000000-0000-0000-0000-000000000099',
    version: 1,
    defaultLocale: 'en',
    locales: ['en'],
    screens: [
      {
        id: 'scr_gate_test',
        name: 'Gate test',
        regions: {
          body: {
            id: 'lyr_body',
            kind: 'stack',
            direction: 'vertical',
            children: bodyChildren,
          },
        },
        next: { default: null },
      },
    ],
    entryScreenId: 'scr_gate_test',
    decisionNodes: [],
    externalSurfaceNodes: [],
    sdkAttributeKeys: [],
  });
};

describe('parseCanvasEditorGates', () => {
  it('resolves null to all enabled', () => {
    const g = parseCanvasEditorGates(null);
    expect(g.lottie).toBe(true);
    expect(g.requestOsPermission).toBe(true);
  });

  it('merges partial overrides', () => {
    const g = parseCanvasEditorGates({ lottie: false, oauthLogin: false });
    expect(g.lottie).toBe(false);
    expect(g.oauthLogin).toBe(false);
    expect(g.emailPasswordAuth).toBe(true);
  });

  it('ignores invalid stored shape', () => {
    const g = parseCanvasEditorGates({ extra: true });
    expect(g.lottie).toBe(true);
  });
});

describe('collectCanvasGateViolations', () => {
  it('returns empty when all gates open', () => {
    const m = manifestWithBodyChildren([
      {
        id: 'lyr_lottie',
        kind: 'lottie',
      },
    ]);
    const issues = collectCanvasGateViolations(m, parseCanvasEditorGates(null));
    expect(issues).toEqual([]);
  });

  it('flags lottie when disabled', () => {
    const m = manifestWithBodyChildren([
      {
        id: 'lyr_lottie',
        kind: 'lottie',
      },
    ]);
    const gates = parseCanvasEditorGates({ lottie: false });
    const issues = collectCanvasGateViolations(m, gates);
    expect(issues.some((i) => i.includes('Lottie'))).toBe(true);
  });

  it('flags request_os_permission when disabled', () => {
    const m = manifestWithBodyChildren([
      {
        id: 'lyr_btn',
        kind: 'button',
        variant: 'primary',
        action: {
          kind: 'request_os_permission',
          permissionKey: 'notifications',
          outcomes: { granted: 'continue', denied: 'continue', blocked: 'continue' },
        },
        direction: 'horizontal',
        align: 'center',
        distribution: 'center',
        children: [{ id: 'lyr_btn_t', kind: 'text', text: { default: 'Allow' } }],
      },
    ]);
    const gates = parseCanvasEditorGates({ requestOsPermission: false });
    const issues = collectCanvasGateViolations(m, gates);
    expect(issues.some((i) => i.includes('OS permission'))).toBe(true);
  });

  it('splits oauth_provider preset vs custom', () => {
    const preset = manifestWithBodyChildren([
      {
        id: 'lyr_oauth_login',
        kind: 'oauth_login',
        children: [
          {
            id: 'lyr_oauth_p',
            kind: 'oauth_provider',
            variant: 'preset',
            provider: 'google',
          },
        ],
      },
    ]);
    expect(collectCanvasGateViolations(preset, parseCanvasEditorGates({ oauthProviderPreset: false })).length).toBe(
      1,
    );
    expect(collectCanvasGateViolations(preset, parseCanvasEditorGates({ oauthProviderCustom: false })).length).toBe(
      0,
    );

    const customParsed = manifestWithBodyChildren([
      {
        id: 'lyr_oauth_login_c',
        kind: 'oauth_login',
        children: [
          {
            id: 'lyr_oauth_c',
            kind: 'oauth_provider',
            variant: 'custom',
            rowId: '00000000-0000-0000-0000-0000000000aa',
            buttonVariant: 'primary',
            children: [{ id: 'lyr_oauth_c_t', kind: 'text', text: { default: 'Go' } }],
          },
        ],
      },
    ]);
    expect(
      collectCanvasGateViolations(customParsed, parseCanvasEditorGates({ oauthProviderCustom: false })).length,
    ).toBe(1);
    expect(
      collectCanvasGateViolations(customParsed, parseCanvasEditorGates({ oauthProviderPreset: false })).length,
    ).toBe(0);
  });
});

describe('describeCanvasGatesForAi', () => {
  it('mentions restrictions when gates off', () => {
    const t = describeCanvasGatesForAi(parseCanvasEditorGates({ lottie: false }));
    expect(t.toLowerCase()).toContain('lottie');
  });
});

describe('manifestPassesCanvasGates', () => {
  it('returns false when violations exist', () => {
    const m = manifestWithBodyChildren([{ id: 'lyr_lottie', kind: 'lottie' }]);
    expect(manifestPassesCanvasGates(m, parseCanvasEditorGates({ lottie: false }))).toBe(false);
  });
});
