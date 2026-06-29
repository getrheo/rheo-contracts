import { describe, expect, it } from 'vitest';
import {
  FlowManifestSchema,
  MANIFEST_SCHEMA_VERSION,
  migrateLegacyManifest,
} from './manifest';

describe('migrateLegacyManifest', () => {
  it('returns a new object without mutating input', () => {
    const raw = {
      flowId: '00000000-0000-4000-8000-000000000001',
      version: 1,
      defaultLocale: 'en',
      locales: ['en'],
      entryScreenId: 'scr_a',
      screens: [
        {
          id: 'scr_a',
          name: 'A',
          next: { default: null },
          regions: {
            body: {
              id: 'lyr_body',
              kind: 'stack',
              direction: 'vertical',
              children: [],
            },
          },
        },
      ],
    };
    const migrated = migrateLegacyManifest(raw);
    expect(migrated).not.toBe(raw);
    expect((migrated as { screens: unknown[] }).screens[0]).not.toBe(
      (raw as { screens: unknown[] }).screens[0],
    );
  });

  it('migrates legacy button label to children', () => {
    const raw = {
      flowId: '00000000-0000-4000-8000-000000000002',
      version: 1,
      defaultLocale: 'en',
      locales: ['en'],
      entryScreenId: 'scr_a',
      screens: [
        {
          id: 'scr_a',
          name: 'A',
          next: { default: null },
          regions: {
            body: {
              id: 'lyr_body',
              kind: 'stack',
              direction: 'vertical',
              children: [
                {
                  id: 'lyr_btn',
                  kind: 'button',
                  label: { default: 'Go' },
                  action: { kind: 'continue' },
                  variant: 'primary',
                },
              ],
            },
          },
        },
      ],
    };
    const migrated = migrateLegacyManifest(raw) as {
      screens: Array<{
        regions: { body: { children: Array<{ kind: string; children?: unknown[] }> } };
      }>;
    };
    const btn = migrated.screens[0]!.regions.body.children[0]!;
    expect(btn.kind).toBe('button');
    expect(btn.children).toHaveLength(1);
    expect((btn.children![0] as { kind: string }).kind).toBe('text');
    expect(FlowManifestSchema.safeParse(migrated).success).toBe(true);
  });

  it('renames progress_bar to progress and sf_symbol icons', () => {
    const raw = {
      flowId: '00000000-0000-4000-8000-000000000003',
      version: 1,
      defaultLocale: 'en',
      locales: ['en'],
      entryScreenId: 'scr_a',
      screens: [
        {
          id: 'scr_a',
          name: 'A',
          next: { default: null },
          regions: {
            body: {
              id: 'lyr_body',
              kind: 'stack',
              direction: 'vertical',
              children: [
                { id: 'lyr_p', kind: 'progress_bar', style: { height: 4 } },
                { id: 'lyr_i', kind: 'icon', family: 'sf_symbol', iconName: 'star' },
              ],
            },
          },
        },
      ],
    };
    const migrated = migrateLegacyManifest(raw) as {
      screens: Array<{
        regions: { body: { children: Array<{ kind: string; family?: string; iconName?: string }> } };
      }>;
    };
    const kids = migrated.screens[0]!.regions.body.children;
    expect(kids[0]!.kind).toBe('progress');
    expect(kids[1]!.family).toBe('ionicons');
    expect(kids[1]!.iconName).toBe('star-outline');
  });

  it('bumps schemaVersion 4/5/6 to current', () => {
    for (const v of [4, 5, 6] as const) {
      const migrated = migrateLegacyManifest({
        schemaVersion: v,
        flowId: '00000000-0000-4000-8000-000000000004',
        version: 1,
        defaultLocale: 'en',
        locales: ['en'],
        entryScreenId: null,
        screens: [],
      }) as { schemaVersion: number };
      expect(migrated.schemaVersion).toBe(MANIFEST_SCHEMA_VERSION);
    }
  });
});
