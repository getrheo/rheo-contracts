import { describe, expect, it } from 'vitest';
import { FlowManifestSchema, MANIFEST_SCHEMA_VERSION } from '../manifest.js';
import { LayerSchema, isInputLayer, isParentLayer } from './index.js';
import { LAYER_KINDS } from './layerKinds.js';
import { manifestScreenLayerKinds, minimalLayerExamples } from './minimalLayerExamples.js';

describe('minimalLayerExamples', () => {
  it('defines an example for every layer kind', () => {
    const byKind = minimalLayerExamples();
    for (const kind of LAYER_KINDS) {
      expect(byKind[kind], `missing minimal example for ${kind}`).toBeDefined();
    }
  });
});

describe('LayerSchema union', () => {
  it('parses a minimal layer for every kind', () => {
    const byKind = minimalLayerExamples();
    for (const kind of LAYER_KINDS) {
      const parsed = LayerSchema.safeParse(byKind[kind]);
      expect(parsed.success, `expected ${kind} to parse`).toBe(true);
    }
  });

  it('round-trips one screen per manifest-safe kind', () => {
    const byKind = minimalLayerExamples();
    const screens = manifestScreenLayerKinds().map((kind) => ({
      id: `scr_${kind}`,
      name: kind,
      regions: {
        body: {
          id: `lyr_body_${kind}`,
          kind: 'stack' as const,
          direction: 'vertical' as const,
          gap: 8,
          children: [byKind[kind]],
        },
      },
      next: { default: null },
    }));
    const manifest = FlowManifestSchema.parse({
      flowId: '00000000-0000-4000-8000-000000000099',
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      version: 1,
      defaultLocale: 'en',
      locales: ['en'],
      entryScreenId: screens[0]!.id,
      screens,
    });
    expect(manifest.screens).toHaveLength(manifestScreenLayerKinds().length);
  });
});

describe('layer guards', () => {
  it('isInputLayer narrows choice and text inputs', () => {
    const byKind = minimalLayerExamples();
    expect(isInputLayer(byKind.text_input)).toBe(true);
    expect(isInputLayer(byKind.single_choice)).toBe(true);
    expect(isInputLayer(byKind.text)).toBe(false);
  });

  it('isParentLayer narrows containers', () => {
    const byKind = minimalLayerExamples();
    expect(isParentLayer(byKind.stack)).toBe(true);
    expect(isParentLayer(byKind.button)).toBe(true);
    expect(isParentLayer(byKind.text)).toBe(false);
  });
});
