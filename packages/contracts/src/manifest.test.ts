import { describe, expect, it } from 'vitest';
import { FlowManifestSchema } from './manifest';
import { validFlow } from './__fixtures__/validFlow';
import type { Screen } from './screens';
import type { StackLayer } from './layers';
import type { ExternalSurfaceNode } from './externalSurfaces';

describe('FlowManifestSchema', () => {
  it('accepts a valid manifest', () => {
    const result = FlowManifestSchema.safeParse(validFlow());
    expect(result.success).toBe(true);
  });

  it('rejects duplicate screen ids', () => {
    const m = validFlow();
    m.screens.push({ ...(m.screens[0] as Screen) });
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('duplicate screen id'))).toBe(true);
    }
  });

  it('rejects invalid branch target', () => {
    const m = validFlow();
    const goal = m.screens.find((s) => s.id === 'scr_goal') as Screen;
    const input = (goal.regions.body.children as StackLayer['children']).find(
      (c) => c.kind === 'single_choice',
    );
    if (!input || input.kind !== 'single_choice') throw new Error('fixture changed');
    input.branching.conditions = [{ choiceId: 'mindfulness', goTo: 'scr_does_not_exist' }];
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
  });

  it('rejects entry screen that does not exist', () => {
    const m = { ...validFlow(), entryScreenId: 'scr_missing' };
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
  });

  it('rejects screens with more than one input layer', () => {
    const m = validFlow();
    const goal = m.screens.find((s) => s.id === 'scr_goal') as Screen;
    goal.regions.body.children.push({
      id: 'lyr_extra_input',
      kind: 'text_input',
      fieldKey: 'extra',
      classification: 'safe',
    });
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('input layers'))).toBe(true);
    }
  });

  it('rejects defaultLocale not in locales', () => {
    const m = { ...validFlow(), defaultLocale: 'de' };
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
  });

  it('rejects unknown layer kinds', () => {
    const m = validFlow();
    const welcome = m.screens.find((s) => s.id === 'scr_welcome') as Screen;
    (welcome.regions.body.children as Array<{ kind: string; id: string }>).push({
      id: 'lyr_bad',
      kind: 'unknown_kind',
    });
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
  });

  it('accepts a valid animation clip targeting a real layer', () => {
    const m = validFlow();
    const welcome = m.screens.find((s) => s.id === 'scr_welcome') as Screen;
    welcome.animations = [
      {
        id: 'clip_title_fade',
        targetLayerId: 'lyr_welcome_title',
        trigger: 'mount',
        durationMs: 300,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { t: 0, value: 0 },
              { t: 1, value: 1 },
            ],
          },
        ],
      },
    ];
    expect(FlowManifestSchema.safeParse(m).success).toBe(true);
  });

  it('rejects animation targeting a layer on another screen', () => {
    const m = validFlow();
    const welcome = m.screens.find((s) => s.id === 'scr_welcome') as Screen;
    welcome.animations = [
      {
        id: 'clip_oops',
        targetLayerId: 'lyr_goal_title',
        trigger: 'mount',
        durationMs: 100,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { t: 0, value: 0 },
              { t: 1, value: 1 },
            ],
          },
        ],
      },
    ];
    expect(FlowManifestSchema.safeParse(m).success).toBe(false);
  });

  it('accepts two mount clips on the same layer (timeline segments)', () => {
    const m = validFlow();
    const welcome = m.screens.find((s) => s.id === 'scr_welcome') as Screen;
    welcome.animations = [
      {
        id: 'a',
        targetLayerId: 'lyr_welcome_title',
        trigger: 'mount',
        durationMs: 100,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { t: 0, value: 0 },
              { t: 1, value: 1 },
            ],
          },
        ],
      },
      {
        id: 'b',
        targetLayerId: 'lyr_welcome_title',
        trigger: 'mount',
        delayMs: 150,
        durationMs: 100,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { t: 0, value: 0 },
              { t: 1, value: 1 },
            ],
          },
        ],
      },
    ];
    expect(FlowManifestSchema.safeParse(m).success).toBe(true);
  });

  it('passes builderMeta through and tolerates extra layout fields', () => {
    const m = {
      ...validFlow(),
      builderMeta: {
        layout: {
          nodes: [{ id: 'scr_welcome', x: 0, y: 0 }],
          canvas: { zoom: 1, x: 0, y: 0 },
        },
      },
    };
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(true);
  });

  it('allows absolute positioning on a non-root layer outside choice options', () => {
    const m = validFlow();
    const welcome = m.screens.find((s) => s.id === 'scr_welcome') as Screen;
    const title = (welcome.regions.body.children as StackLayer['children']).find(
      (c) => c.id === 'lyr_welcome_title',
    );
    if (!title || title.kind !== 'text') throw new Error('fixture changed');
    title.style = { ...title.style, position: 'absolute', inset: { t: 0, l: 0 } };
    expect(FlowManifestSchema.safeParse(m).success).toBe(true);
  });

  it('rejects absolute positioning on a screen region root layer', () => {
    const m = validFlow();
    const welcome = m.screens.find((s) => s.id === 'scr_welcome') as Screen;
    welcome.regions.body.style = {
      ...welcome.regions.body.style,
      position: 'absolute',
    };
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('cannot use absolute positioning on a screen region root'),
        ),
      ).toBe(true);
    }
  });

  it('rejects absolute positioning inside a choice option subtree', () => {
    const m = validFlow();
    const goal = m.screens.find((s) => s.id === 'scr_goal') as Screen;
    const input = (goal.regions.body.children as StackLayer['children']).find(
      (c) => c.kind === 'single_choice',
    );
    if (!input || input.kind !== 'single_choice') throw new Error('fixture changed');
    const optStack = input.children.find((c) => c.id === 'lyr_goal_opt_fitness');
    if (!optStack || optStack.kind !== 'stack') throw new Error('fixture changed');
    const label = optStack.children.find((c) => c.id === 'lyr_goal_opt_fitness_text');
    if (!label || label.kind !== 'text') throw new Error('fixture changed');
    label.style = { ...label.style, position: 'absolute' };
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('cannot use absolute positioning inside a choice option'),
        ),
      ).toBe(true);
    }
  });

  it('rejects absolute from styleBreakpoints inside a choice option', () => {
    const m = validFlow();
    const goal = m.screens.find((s) => s.id === 'scr_goal') as Screen;
    const input = (goal.regions.body.children as StackLayer['children']).find(
      (c) => c.kind === 'single_choice',
    );
    if (!input || input.kind !== 'single_choice') throw new Error('fixture changed');
    const optStack = input.children.find((c) => c.id === 'lyr_goal_opt_fitness');
    if (!optStack || optStack.kind !== 'stack') throw new Error('fixture changed');
    optStack.styleBreakpoints = { sm: { position: 'absolute' } };
    const result = FlowManifestSchema.safeParse(m);
    expect(result.success).toBe(false);
  });

  describe('external surface nodes', () => {
    const baseRcSurface = (id = 'surf_paywall'): ExternalSurfaceNode => ({
      id,
      name: 'Welcome paywall',
      config: { provider: 'revenuecat', offeringId: 'default' },
      outcomes: {
        purchase_completed: 'scr_done',
        dismissed: 'scr_done',
      },
      fallback: 'scr_done',
    });

    it('accepts a manifest containing a RevenueCat external surface', () => {
      const m = validFlow();
      const welcome = m.screens.find((s) => s.id === 'scr_welcome') as Screen;
      welcome.next = { default: 'surf_paywall' };
      m.externalSurfaceNodes = [baseRcSurface()];
      expect(FlowManifestSchema.safeParse(m).success).toBe(true);
    });

    it('accepts an external surface with unspecified provider (authoring)', () => {
      const m = validFlow();
      m.externalSurfaceNodes = [
        {
          id: 'surf_new',
          name: 'New step',
          config: { provider: 'unspecified' },
          outcomes: {},
          fallback: 'scr_done',
        },
      ];
      expect(FlowManifestSchema.safeParse(m).success).toBe(true);
    });

    it('rejects an external surface whose outcome target is not found', () => {
      const m = validFlow();
      m.externalSurfaceNodes = [
        { ...baseRcSurface(), outcomes: { purchase_completed: 'scr_missing' } },
      ];
      const result = FlowManifestSchema.safeParse(m);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message.includes('outcome "purchase_completed"')),
        ).toBe(true);
      }
    });

    it('rejects an external surface whose fallback is not found', () => {
      const m = validFlow();
      m.externalSurfaceNodes = [{ ...baseRcSurface(), fallback: 'scr_missing' }];
      const result = FlowManifestSchema.safeParse(m);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('fallback'))).toBe(true);
      }
    });

    it('rejects an external surface id that collides with a screen id', () => {
      const m = validFlow();
      m.externalSurfaceNodes = [{ ...baseRcSurface('surf_done'), id: 'scr_done' as never }];
      const result = FlowManifestSchema.safeParse(m);
      expect(result.success).toBe(false);
    });

    it('rejects duplicate external surface ids', () => {
      const m = validFlow();
      m.externalSurfaceNodes = [baseRcSurface('surf_paywall'), baseRcSurface('surf_paywall')];
      const result = FlowManifestSchema.safeParse(m);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('duplicate external surface id'))).toBe(true);
      }
    });

    it('allows decision nodes to reference reserved RC sdk keys without listing them in sdkAttributeKeys', () => {
      const m = validFlow();
      m.decisionNodes = [
        {
          id: 'dec_after_paywall',
          cases: [
            {
              id: 'dec_after_paywall_case_0',
              name: 'Group 1',
              expression: {
                kind: 'predicate',
                variable: { kind: 'sdk', key: 'onb_rc_last_event' },
                predicate: { type: 'string', pred: { op: 'eq', value: 'purchase_completed' } },
              },
              next: 'scr_done',
            },
          ],
          elseNext: 'scr_done',
        },
      ];
      // Intentionally NOT adding `onb_rc_last_event` to sdkAttributeKeys.
      expect(FlowManifestSchema.safeParse(m).success).toBe(true);
    });

    it('still rejects non-reserved sdk keys when omitted from sdkAttributeKeys', () => {
      const m = validFlow();
      m.decisionNodes = [
        {
          id: 'dec_custom_attr',
          cases: [
            {
              id: 'dec_custom_attr_case_0',
              name: 'Group 1',
              expression: {
                kind: 'predicate',
                variable: { kind: 'sdk', key: 'my_custom_attr' },
                predicate: { type: 'string', pred: { op: 'eq', value: 'x' } },
              },
              next: 'scr_done',
            },
          ],
          elseNext: 'scr_done',
        },
      ];
      expect(FlowManifestSchema.safeParse(m).success).toBe(false);
    });

    it('allows a decision node to target an external surface', () => {
      const m = validFlow();
      m.externalSurfaceNodes = [baseRcSurface()];
      m.decisionNodes = [
        {
          id: 'dec_route',
          cases: [
            {
              id: 'dec_route_case_0',
              name: 'Group 1',
              expression: {
                kind: 'predicate',
                variable: { kind: 'builtin', name: 'platform' },
                predicate: { type: 'string', pred: { op: 'eq', value: 'ios' } },
              },
              next: 'surf_paywall',
            },
          ],
          elseNext: 'scr_done',
        },
      ];
      expect(FlowManifestSchema.safeParse(m).success).toBe(true);
    });
  });
});
