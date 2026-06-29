import { z } from 'zod';
import { LocalizedTextSchema } from '../../localized.js';
import type {
  OAuthPresetButtonChrome,
  OAuthPresetButtonChromeBreakpoints,
  OAuthLoginPreset,
  EmailPasswordAuthMode,
  EmailPasswordSlot,
} from '../oauthConstants.js';
import type {
  CommonStyle,
  CommonStyleBreakpoints,
  ButtonLayoutBreakpoints,
  ButtonStyle,
  ButtonStyleBreakpoints,
  ButtonLayerVariant,
} from '../styleCommon.js';
import type { RestingMotion, RestingMotionEntry } from '../restingMotion.js';
import type { LayerRaw } from './union.js';


export type OAuthProviderPresetLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'oauth_provider';
  variant: 'preset';
  provider: OAuthLoginPreset;
  /** Visible button copy; defaults to {@link DEFAULT_OAUTH_PRESET_BUTTON_LABEL} for the provider. */
  label?: z.infer<typeof LocalizedTextSchema>;
  style?: OAuthPresetButtonChrome;
  styleBreakpoints?: OAuthPresetButtonChromeBreakpoints;
};
/**
 * Custom OAuth row: same composition model as {@link ButtonLayerRaw} — `children` hold
 * icon and/or text so each can be styled independently. SDK `oauth_login_resolve`
 * still receives a flattened { label, family, iconName } derived from those children.
 */
export type OAuthProviderCustomLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'oauth_provider';
  variant: 'custom';
  rowId: string;
  /** Mirrors {@link ButtonLayerRaw.variant} (built-in button chrome presets). */
  buttonVariant: ButtonLayerVariant;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  distribution?: 'start' | 'center' | 'end' | 'between' | 'around';
  children: LayerRaw[];
  style?: ButtonStyle;
  styleBreakpoints?: ButtonStyleBreakpoints;
  buttonLayoutBreakpoints?: ButtonLayoutBreakpoints;
};
export type OAuthProviderLayerRaw = OAuthProviderPresetLayerRaw | OAuthProviderCustomLayerRaw;

export type OAuthLoginLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'oauth_login';
  children: OAuthProviderLayerRaw[];
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};

export type EmailPasswordFieldLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'email_password_field';
  slot: EmailPasswordSlot;
  /** Placeholder shown in the synthetic input control. */
  placeholder?: z.infer<typeof LocalizedTextSchema>;
  /** Labels, hints, icons (same spirit as decoration children on {@link TextInputLayer}). */
  children?: LayerRaw[];
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};

/** Submit chrome row (`email_password_auth` aggregates submit); composition matches custom {@link OAuthProviderCustomLayerRaw}. */
export type EmailPasswordSubmitLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'email_password_submit';
  buttonVariant: ButtonLayerVariant;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  distribution?: 'start' | 'center' | 'end' | 'between' | 'around';
  children: LayerRaw[];
  style?: ButtonStyle;
  styleBreakpoints?: ButtonStyleBreakpoints;
  buttonLayoutBreakpoints?: ButtonLayoutBreakpoints;
};

/**
 * Email + password capture: editable container (`style`/`gap`) and editable child rows
 * ({@link EmailPasswordFieldLayer} + {@link EmailPasswordSubmitLayer}).
 */
export type EmailPasswordAuthLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'email_password_auth';
  mode: EmailPasswordAuthMode;
  /** Analytics / completion map key (same role as `text_input.fieldKey`). */
  fieldKey: string;
  /** Minimum password length when validating (default 8 at runtime if omitted). */
  minPasswordLength?: number;
  children: Array<EmailPasswordFieldLayerRaw | EmailPasswordSubmitLayerRaw>;
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};
