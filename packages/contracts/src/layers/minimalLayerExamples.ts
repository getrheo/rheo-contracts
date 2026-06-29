import { DEFAULT_THEMED_FOREGROUND, PRIMARY_FILLED_LABEL } from './themedColor.js';
import type { Layer } from './layerUnion.js';
import { LAYER_KINDS, type LayerKind } from './layerKinds.js';

const label = (id: string, copy: string) => ({
  id,
  kind: 'text' as const,
  text: { default: copy },
  style: { color: PRIMARY_FILLED_LABEL },
});

const choiceOptions = (prefix: string) => {
  const a = {
    id: `${prefix}_opt_a`,
    kind: 'stack' as const,
    direction: 'horizontal' as const,
    align: 'center' as const,
    gap: 8,
    children: [
      {
        id: `${prefix}_opt_a_t`,
        kind: 'text' as const,
        text: { default: 'A' },
        style: { color: DEFAULT_THEMED_FOREGROUND },
      },
    ],
  };
  const b = {
    id: `${prefix}_opt_b`,
    kind: 'stack' as const,
    direction: 'horizontal' as const,
    align: 'center' as const,
    gap: 8,
    children: [
      {
        id: `${prefix}_opt_b_t`,
        kind: 'text' as const,
        text: { default: 'B' },
        style: { color: DEFAULT_THEMED_FOREGROUND },
      },
    ],
  };
  return {
    children: [a, b],
    optionBindings: [
      { optionId: 'a', rootLayerId: `${prefix}_opt_a` },
      { optionId: 'b', rootLayerId: `${prefix}_opt_b` },
    ],
  };
};

/** Minimal valid layer per kind (unique ids; nested-only kinds valid in isolation for LayerSchema). */
export const minimalLayerExamples = (): Record<LayerKind, Layer> => ({
  stack: {
    id: 'lyr_stack',
    kind: 'stack',
    direction: 'vertical',
    gap: 8,
    children: [
      {
        id: 'lyr_stack_txt',
        kind: 'text',
        text: { default: 'Nested' },
        style: { color: DEFAULT_THEMED_FOREGROUND },
      },
    ],
  },
  text: {
    id: 'lyr_text',
    kind: 'text',
    text: { default: 'Hello' },
    style: { color: DEFAULT_THEMED_FOREGROUND },
  },
  image: { id: 'lyr_image', kind: 'image', alt: 'x' },
  lottie: { id: 'lyr_lottie', kind: 'lottie', loop: true },
  video: { id: 'lyr_video', kind: 'video', loop: true },
  icon: { id: 'lyr_icon', kind: 'icon', family: 'ionicons', iconName: 'star-outline' },
  button: {
    id: 'lyr_btn',
    kind: 'button',
    variant: 'primary',
    action: { kind: 'continue' },
    children: [label('lyr_btn_t', 'Go')],
  },
  back_button: {
    id: 'lyr_back',
    kind: 'back_button',
    variant: 'secondary',
    children: [label('lyr_back_t', 'Back')],
  },
  progress: { id: 'lyr_prog', kind: 'progress', style: { height: 6 } },
  loader: { id: 'lyr_load', kind: 'loader', variant: 'linear' },
  counter: {
    id: 'lyr_ctr',
    kind: 'counter',
    startValue: 0,
    endValue: 10,
    durationMs: 500,
  },
  single_choice: {
    id: 'lyr_sc',
    kind: 'single_choice',
    fieldKey: 'pick',
    branching: { enabled: false, conditions: [] },
    ...choiceOptions('lyr_sc'),
  },
  multiple_choice: {
    id: 'lyr_mc',
    kind: 'multiple_choice',
    fieldKey: 'tags',
    branching: { enabled: false, conditions: [] },
    ...choiceOptions('lyr_mc'),
  },
  text_input: {
    id: 'lyr_ti',
    kind: 'text_input',
    fieldKey: 'name',
    classification: 'safe',
  },
  scale_input: {
    id: 'lyr_scale',
    kind: 'scale_input',
    fieldKey: 'level',
    min: 1,
    max: 5,
    defaultValue: 3,
  },
  oauth_provider: {
    id: 'lyr_oauth_gh',
    kind: 'oauth_provider',
    variant: 'preset',
    provider: 'github',
  },
  oauth_login: {
    id: 'lyr_oauth',
    kind: 'oauth_login',
    gap: 8,
    children: [
      {
        id: 'lyr_oauth_gh_inner',
        kind: 'oauth_provider',
        variant: 'preset',
        provider: 'google',
      },
    ],
  },
  email_password_auth: {
    id: 'lyr_epa',
    kind: 'email_password_auth',
    mode: 'sign_in',
    fieldKey: 'credentials',
    children: [
      {
        id: 'lyr_epf_email',
        kind: 'email_password_field',
        slot: 'email',
        placeholder: { default: 'Email' },
      },
      {
        id: 'lyr_epf_pass',
        kind: 'email_password_field',
        slot: 'password',
        placeholder: { default: 'Password' },
      },
      {
        id: 'lyr_eps',
        kind: 'email_password_submit',
        buttonVariant: 'primary',
        children: [label('lyr_eps_t', 'Sign in')],
      },
    ],
  },
  email_password_field: {
    id: 'lyr_epf_only',
    kind: 'email_password_field',
    slot: 'email',
  },
  email_password_submit: {
    id: 'lyr_eps_only',
    kind: 'email_password_submit',
    buttonVariant: 'primary',
    children: [label('lyr_eps_only_t', 'Submit')],
  },
  carousel: {
    id: 'lyr_car',
    kind: 'carousel',
    slides: [
      {
        id: 'lyr_slide',
        kind: 'stack',
        direction: 'vertical',
        gap: 8,
        children: [
          {
            id: 'lyr_slide_t',
            kind: 'text',
            text: { default: 'Slide' },
            style: { color: DEFAULT_THEMED_FOREGROUND },
          },
        ],
      },
    ],
  },
  hyperlink: {
    id: 'lyr_link',
    kind: 'hyperlink',
    href: 'https://example.com',
    children: [
      {
        id: 'lyr_link_t',
        kind: 'text',
        text: { default: 'Link' },
        style: { color: DEFAULT_THEMED_FOREGROUND },
      },
    ],
  },
  checkbox: {
    id: 'lyr_chk',
    kind: 'checkbox',
    fieldKey: 'agree',
  },
});

/** Kinds that may appear as the sole layer on a screen body (manifest rules). */
export const manifestScreenLayerKinds = (): LayerKind[] =>
  LAYER_KINDS.filter(
    (k) => k !== 'oauth_provider' && k !== 'email_password_field' && k !== 'email_password_submit',
  );
