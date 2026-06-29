import { z } from 'zod';
import type { FlowManifest } from './manifest';
import type { Layer } from './layers';
import { walkScreenLayers } from './screens';

/** Keys stored in DB / API; false = capability disabled in the canvas editor. */
export const CANVAS_EDITOR_GATE_KEYS = [
  'lottie',
  'oauthLogin',
  'oauthProviderPreset',
  'oauthProviderCustom',
  'emailPasswordAuth',
  'emailPasswordField',
  'emailPasswordSubmit',
  'requestOsPermission',
] as const;

export type CanvasEditorGateKey = (typeof CANVAS_EDITOR_GATE_KEYS)[number];

export type ResolvedCanvasEditorGates = Record<CanvasEditorGateKey, boolean>;

export const CanvasEditorGatesResolvedSchema = z.object({
  lottie: z.boolean(),
  oauthLogin: z.boolean(),
  oauthProviderPreset: z.boolean(),
  oauthProviderCustom: z.boolean(),
  emailPasswordAuth: z.boolean(),
  emailPasswordField: z.boolean(),
  emailPasswordSubmit: z.boolean(),
  requestOsPermission: z.boolean(),
});

export type CanvasEditorGatesResolved = z.infer<typeof CanvasEditorGatesResolvedSchema>;

const ALL_TRUE: ResolvedCanvasEditorGates = {
  lottie: true,
  oauthLogin: true,
  oauthProviderPreset: true,
  oauthProviderCustom: true,
  emailPasswordAuth: true,
  emailPasswordField: true,
  emailPasswordSubmit: true,
  requestOsPermission: true,
};

/** Partial overrides; omitted keys default to enabled (true). */
export const CanvasEditorGatesPatchSchema = z
  .object({
    lottie: z.boolean().optional(),
    oauthLogin: z.boolean().optional(),
    oauthProviderPreset: z.boolean().optional(),
    oauthProviderCustom: z.boolean().optional(),
    emailPasswordAuth: z.boolean().optional(),
    emailPasswordField: z.boolean().optional(),
    emailPasswordSubmit: z.boolean().optional(),
    requestOsPermission: z.boolean().optional(),
  })
  .strict();

export type CanvasEditorGatesPatch = z.infer<typeof CanvasEditorGatesPatchSchema>;

export const parseCanvasEditorGates = (
  raw: unknown | null | undefined,
): ResolvedCanvasEditorGates => {
  if (raw == null) return { ...ALL_TRUE };
  const parsed = CanvasEditorGatesPatchSchema.safeParse(raw);
  if (!parsed.success) return { ...ALL_TRUE };
  return { ...ALL_TRUE, ...parsed.data };
};

const layerViolationMessage = (screenId: string, layerId: string, label: string): string =>
  `Screen "${screenId}": ${label} (layer "${layerId}") is disabled for this app in canvas editor settings.`;

const buttonOsPermissionMessage = (screenId: string, layerId: string): string =>
  `Screen "${screenId}": request OS permission button actions are disabled for this app (layer "${layerId}").`;

/**
 * Returns human-readable issues when the manifest uses capabilities that are
 * turned off for the app. Empty when allowed.
 */
export const collectCanvasGateViolations = (
  manifest: FlowManifest,
  gates: ResolvedCanvasEditorGates,
): string[] => {
  const issues: string[] = [];

  for (const screen of manifest.screens) {
    walkScreenLayers(screen, (l: Layer) => {
      if ((l.kind === 'lottie' || l.kind === 'video') && !gates.lottie) {
        issues.push(
          layerViolationMessage(
            screen.id,
            l.id,
            l.kind === 'video' ? 'Video layers' : 'Lottie layers',
          ),
        );
      }
      if (l.kind === 'oauth_login' && !gates.oauthLogin) {
        issues.push(layerViolationMessage(screen.id, l.id, 'OAuth login layers'));
      }
      if (l.kind === 'oauth_provider') {
        if (l.variant === 'preset' && !gates.oauthProviderPreset) {
          issues.push(layerViolationMessage(screen.id, l.id, 'OAuth provider (preset) layers'));
        }
        if (l.variant === 'custom' && !gates.oauthProviderCustom) {
          issues.push(layerViolationMessage(screen.id, l.id, 'OAuth provider (custom) layers'));
        }
      }
      if (l.kind === 'email_password_auth' && !gates.emailPasswordAuth) {
        issues.push(layerViolationMessage(screen.id, l.id, 'Email/password auth layers'));
      }
      if (l.kind === 'email_password_field' && !gates.emailPasswordField) {
        issues.push(layerViolationMessage(screen.id, l.id, 'Email/password field layers'));
      }
      if (l.kind === 'email_password_submit' && !gates.emailPasswordSubmit) {
        issues.push(layerViolationMessage(screen.id, l.id, 'Email/password submit layers'));
      }
      if (l.kind === 'button' && l.action.kind === 'request_os_permission' && !gates.requestOsPermission) {
        issues.push(buttonOsPermissionMessage(screen.id, l.id));
      }
    });
  }

  return issues;
};

export const manifestPassesCanvasGates = (
  manifest: FlowManifest,
  gates: ResolvedCanvasEditorGates,
): boolean => collectCanvasGateViolations(manifest, gates).length === 0;

/** One-line constraints for AI system prompts. */
export const describeCanvasGatesForAi = (gates: ResolvedCanvasEditorGates): string => {
  const disabled: string[] = [];
  if (!gates.lottie) disabled.push('do not use lottie or video layers');
  if (!gates.oauthLogin) disabled.push('do not use oauth_login layers');
  if (!gates.oauthProviderPreset) disabled.push('do not use oauth_provider with variant preset');
  if (!gates.oauthProviderCustom) disabled.push('do not use oauth_provider with variant custom');
  if (!gates.emailPasswordAuth) disabled.push('do not use email_password_auth layers');
  if (!gates.emailPasswordField) disabled.push('do not use email_password_field layers');
  if (!gates.emailPasswordSubmit) disabled.push('do not use email_password_submit layers');
  if (!gates.requestOsPermission) disabled.push('do not use button actions with kind request_os_permission');
  if (disabled.length === 0) {
    return 'Canvas editor: all advanced layer types and OS permission button actions are allowed.';
  }
  return `Canvas editor restrictions for this app — ${disabled.join('; ')}.`;
};
