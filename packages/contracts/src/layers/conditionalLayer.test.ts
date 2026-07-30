import { describe, expect, it } from 'vitest';
import { validFlow } from '../__fixtures__/validFlow';
import { FlowManifestSchema } from '../manifest';
import type { FlowManifest } from '../manifest';
import type { Screen } from '../screens';
import type { ConditionalLayer, DecisionExpr, Layer, StackLayer } from '../layers';

const platformIs = (value: string): DecisionExpr => ({
  kind: 'predicate',
  variable: { kind: 'builtin', name: 'platform' },
  predicate: { type: 'string', pred: { op: 'eq', value } },
});

const fieldEquals = (fieldKey: string, value: string): DecisionExpr => ({
  kind: 'predicate',
  variable: { kind: 'field', fieldKey },
  predicate: { type: 'string', pred: { op: 'eq', value } },
});

const stack = (id: string, children: Layer[] = []): StackLayer => ({
  id,
  kind: 'stack',
  direction: 'vertical',
  gap: 8,
  children,
});

const conditional = (
  id: string,
  cases: ConditionalLayer['cases'],
  children: StackLayer[],
  elseRootLayerId: string,
): ConditionalLayer => ({ id, kind: 'conditional', cases, elseRootLayerId, children });

const simpleConditional = (): ConditionalLayer =>
  conditional(
    'lyr_cond',
    [{ id: 'case_ios', expression: platformIs('ios'), rootLayerId: 'lyr_cond_ios' }],
    [stack('lyr_cond_ios'), stack('lyr_cond_else')],
    'lyr_cond_else',
  );

const flowWithConditional = (layer: ConditionalLayer, screenId = 'scr_welcome'): FlowManifest => {
  const m = validFlow();
  const screen = m.screens.find((s) => s.id === screenId) as Screen;
  screen.regions.body.children.push(layer);
  return m;
};

const issues = (m: FlowManifest): string[] => {
  const result = FlowManifestSchema.safeParse(m);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('conditional layer', () => {
  it('accepts an if / else conditional', () => {
    expect(issues(flowWithConditional(simpleConditional()))).toEqual([]);
  });

  it('rejects a case bound to a stack that is not a direct child', () => {
    const layer = simpleConditional();
    layer.cases[0]!.rootLayerId = 'lyr_welcome_title';
    expect(issues(flowWithConditional(layer)).join(' ')).toContain(
      'does not match any direct child stack',
    );
  });

  it('rejects two branches bound to the same stack', () => {
    const layer = simpleConditional();
    layer.elseRootLayerId = 'lyr_cond_ios';
    expect(issues(flowWithConditional(layer)).join(' ')).toContain(
      'is bound to more than one branch',
    );
  });

  it('rejects a child stack that no branch renders', () => {
    const layer = simpleConditional();
    layer.children.push(stack('lyr_cond_orphan'));
    expect(issues(flowWithConditional(layer)).join(' ')).toContain(
      'is not bound to a case or the else branch',
    );
  });

  it('accepts an empty case expression while drafting (publish gates it)', () => {
    const layer = simpleConditional();
    layer.cases[0]!.expression = { kind: 'empty' };
    expect(issues(flowWithConditional(layer))).toEqual([]);
  });

  it('rejects sdk keys outside sdkAttributeKeys', () => {
    const layer = simpleConditional();
    layer.cases[0]!.expression = {
      kind: 'predicate',
      variable: { kind: 'sdk', key: 'plan_tier' },
      predicate: { type: 'string', pred: { op: 'eq', value: 'pro' } },
    };
    expect(issues(flowWithConditional(layer)).join(' ')).toContain(
      'references sdk key "plan_tier" not in sdkAttributeKeys',
    );
  });

  it('accepts sdk keys declared on the manifest', () => {
    const layer = simpleConditional();
    layer.cases[0]!.expression = {
      kind: 'predicate',
      variable: { kind: 'sdk', key: 'plan_tier' },
      predicate: { type: 'string', pred: { op: 'eq', value: 'pro' } },
    };
    const m = flowWithConditional(layer);
    m.sdkAttributeKeys = ['plan_tier'];
    expect(issues(m)).toEqual([]);
  });

  it('rejects an unknown fieldKey', () => {
    const layer = simpleConditional();
    layer.cases[0]!.expression = fieldEquals('never_asked', 'x');
    expect(issues(flowWithConditional(layer)).join(' ')).toContain('unknown fieldKey');
  });

  it('accepts an upstream fieldKey answered on another screen', () => {
    const layer = simpleConditional();
    layer.cases[0]!.expression = fieldEquals('first_name', 'Ada');
    expect(issues(flowWithConditional(layer, 'scr_done'))).toEqual([]);
  });

  it('rejects reading a fieldKey answered after it on the same screen', () => {
    const layer = simpleConditional();
    layer.cases[0]!.expression = fieldEquals('first_name', 'Ada');
    const m = validFlow();
    const screen = m.screens.find((s) => s.id === 'scr_name') as Screen;
    screen.regions.body.children.unshift(layer);
    expect(issues(m).join(' ')).toContain('answered at or after it on the same screen');
  });

  it('accepts reading a fieldKey answered before it on the same screen', () => {
    const layer = simpleConditional();
    layer.cases[0]!.expression = fieldEquals('first_name', 'Ada');
    const m = validFlow();
    const screen = m.screens.find((s) => s.id === 'scr_name') as Screen;
    screen.regions.body.children.push(layer);
    expect(issues(m)).toEqual([]);
  });

  it('allows one input per branch because branches are exclusive', () => {
    const layer = conditional(
      'lyr_cond',
      [{ id: 'case_ios', expression: platformIs('ios'), rootLayerId: 'lyr_cond_ios' }],
      [
        stack('lyr_cond_ios', [
          { id: 'lyr_ios_input', kind: 'text_input', fieldKey: 'ios_note', classification: 'safe' },
        ]),
        stack('lyr_cond_else', [
          {
            id: 'lyr_else_input',
            kind: 'text_input',
            fieldKey: 'other_note',
            classification: 'safe',
          },
        ]),
      ],
      'lyr_cond_else',
    );
    expect(issues(flowWithConditional(layer))).toEqual([]);
  });

  it('rejects an input inside a branch when the screen already has one outside', () => {
    const layer = conditional(
      'lyr_cond',
      [{ id: 'case_ios', expression: platformIs('ios'), rootLayerId: 'lyr_cond_ios' }],
      [
        stack('lyr_cond_ios', [
          { id: 'lyr_ios_input', kind: 'text_input', fieldKey: 'ios_note', classification: 'safe' },
        ]),
        stack('lyr_cond_else'),
      ],
      'lyr_cond_else',
    );
    expect(issues(flowWithConditional(layer, 'scr_name')).join(' ')).toContain(
      'input layers at once',
    );
  });

  it('counts the widest path through nested conditionals', () => {
    const inner = conditional(
      'lyr_inner',
      [{ id: 'case_fr', expression: platformIs('android'), rootLayerId: 'lyr_inner_a' }],
      [
        stack('lyr_inner_a', [
          { id: 'lyr_inner_input', kind: 'text_input', fieldKey: 'note_a', classification: 'safe' },
        ]),
        stack('lyr_inner_else'),
      ],
      'lyr_inner_else',
    );
    const outer = conditional(
      'lyr_cond',
      [{ id: 'case_ios', expression: platformIs('ios'), rootLayerId: 'lyr_cond_ios' }],
      [
        stack('lyr_cond_ios', [
          inner,
          { id: 'lyr_outer_input', kind: 'text_input', fieldKey: 'note_b', classification: 'safe' },
        ]),
        stack('lyr_cond_else'),
      ],
      'lyr_cond_else',
    );
    expect(issues(flowWithConditional(outer)).join(' ')).toContain('input layers at once');
  });
});
