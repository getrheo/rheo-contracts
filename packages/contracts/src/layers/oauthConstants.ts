import { z } from 'zod';
import { LocalizedTextSchema } from '../localized.js';
import {
  CommonStyleSchema,
  BorderSchema,
  DropShadowSchema,
  ThemedColorSchema,
  type IconFamily,
} from './styleCommon.js';

export const CheckboxGlyphStyleSchema = z
  .object({
    /** Square edge length in px. */
    size: z.number().int().min(8).max(128).optional(),
    radius: z.number().int().min(0).max(96).optional(),
    background: ThemedColorSchema.optional(),
    border: BorderSchema.optional(),
    shadow: DropShadowSchema.optional(),
    opacity: z.number().min(0).max(1).optional(),
    /** Fill color for the check mark when checked. */
    checkColor: ThemedColorSchema.optional(),
  })
  .partial();
export type CheckboxGlyphStyle = z.infer<typeof CheckboxGlyphStyleSchema>;

export const OAUTH_LOGIN_PRESETS = ['github', 'google', 'apple'] as const;
export type OAuthLoginPreset = (typeof OAUTH_LOGIN_PRESETS)[number];

/** Human-readable preset names for tooling UI (panels, inspector). Stored `provider` stays lowercase. */
export const OAUTH_LOGIN_PRESET_DISPLAY: Record<OAuthLoginPreset, string> = {
  google: 'Google',
  github: 'GitHub',
  apple: 'Apple',
};

/** Default English copy for preset OAuth buttons. Authors can override per button via {@link OAuthProviderPresetLayerRaw.label}. */
export const DEFAULT_OAUTH_PRESET_BUTTON_LABEL: Record<OAuthLoginPreset, string> = {
  google: 'Sign in with Google',
  github: 'Continue with GitHub',
  apple: 'Sign in with Apple',
};

export const defaultOAuthPresetButtonLabel = (provider: OAuthLoginPreset): string =>
  DEFAULT_OAUTH_PRESET_BUTTON_LABEL[provider];

/** Effective manifest text for a preset row (optional `label` merged with provider default). */
export const oauthPresetEffectiveLabel = (
  provider: OAuthLoginPreset,
  label: z.infer<typeof LocalizedTextSchema> | undefined,
): z.infer<typeof LocalizedTextSchema> => {
  const base = DEFAULT_OAUTH_PRESET_BUTTON_LABEL[provider];
  if (!label) return { default: base };
  const d =
    typeof label.default === 'string' && label.default.trim().length > 0 ? label.default : base;
  return {
    default: d,
    ...(label.translations && Object.keys(label.translations).length > 0
      ? { translations: { ...label.translations } }
      : {}),
  };
};

export type OAuthLoginProvider =
  | { type: 'preset'; provider: OAuthLoginPreset }
  | {
      type: 'custom';
      rowId: string;
      label: z.infer<typeof LocalizedTextSchema>;
      family: IconFamily;
      iconName: string;
    };

/**
 * Minimal layout chrome allowed on branded OAuth preset buttons (Google / Apple /
 * GitHub); colors and typography stay provider-standard at runtime.
 */
export const OAuthPresetButtonChromeSchema = CommonStyleSchema.pick({
  width: true,
  padding: true,
  margin: true,
  radius: true,
}).partial();
export type OAuthPresetButtonChrome = z.infer<typeof OAuthPresetButtonChromeSchema>;

export const OAuthPresetButtonChromeBreakpointsSchema = z
  .object({
    sm: OAuthPresetButtonChromeSchema.partial().optional(),
    md: OAuthPresetButtonChromeSchema.partial().optional(),
    lg: OAuthPresetButtonChromeSchema.partial().optional(),
    xl: OAuthPresetButtonChromeSchema.partial().optional(),
    '2xl': OAuthPresetButtonChromeSchema.partial().optional(),
  })
  .partial()
  .optional();
export type OAuthPresetButtonChromeBreakpoints = z.infer<
  typeof OAuthPresetButtonChromeBreakpointsSchema
>;

export const EMAIL_PASSWORD_AUTH_MODES = ['sign_in', 'sign_up'] as const;
export type EmailPasswordAuthMode = (typeof EMAIL_PASSWORD_AUTH_MODES)[number];

export const EMAIL_PASSWORD_SLOTS = ['email', 'password', 'confirm'] as const;
export type EmailPasswordSlot = (typeof EMAIL_PASSWORD_SLOTS)[number];
