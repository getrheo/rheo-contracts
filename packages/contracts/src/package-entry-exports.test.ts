import { describe, expect, it } from 'vitest';
import {
  MANIFEST_SCHEMA_VERSION,
  FlowManifestSchema,
  SdkResolveResponseSchema,
  BrandingSchema,
  collectCanvasGateViolations,
} from './index';
import * as publicEntry from './index';

describe('@getrheo/contracts public entry', () => {
  it('exports manifest, sdk, and authoring helpers', () => {
    expect(typeof MANIFEST_SCHEMA_VERSION).toBe('number');
    expect(FlowManifestSchema.safeParse({})).toBeDefined();
    expect(SdkResolveResponseSchema).toBeDefined();
    expect(
      BrandingSchema.safeParse({ colorPresets: [], gradientPresets: [], fontFamilies: [] }).success,
    ).toBe(true);
    expect(typeof collectCanvasGateViolations).toBe('function');
  });

  it('does not export platform-only symbols from the public barrel', () => {
    expect(publicEntry).not.toHaveProperty('parseWorkspaceRole');
    expect(publicEntry).not.toHaveProperty('resolveCapabilities');
    expect(publicEntry).not.toHaveProperty('getPlanEntitlements');
    expect(publicEntry).not.toHaveProperty('FlowPreview');
    expect(publicEntry).not.toHaveProperty('FlowPreviewSchema');
    expect(publicEntry).not.toHaveProperty('AppSchema');
  });
});
