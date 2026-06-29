import { z } from 'zod';
import { LocalizedTextSchema } from '../../../localized.js';
import { baseLayerShape } from '../../base.js';
import { layerSchemaStore } from '../../layerSchemaRef.js';
const lazyLayer = () => layerSchemaStore.schema!;
import type { LayerRaw } from '../../layerRawTypes.js';
import {
  ButtonStyleSchema,
  ButtonStyleBreakpointsSchema,
  ButtonLayoutBreakpointsSchema,
  ButtonLayerVariantSchema,
} from '../../styleCommon.js';
import {
  OAuthPresetButtonChromeSchema,
  OAuthPresetButtonChromeBreakpointsSchema,
} from '../../oauthConstants.js';
import { OAUTH_LOGIN_PRESETS } from '../../oauthConstants.js';
import type {
  OAuthProviderLayerRaw,
  OAuthProviderCustomLayerRaw,
  IconLayerRaw,
  TextLayerRaw,
} from '../../layerRawTypes.js';
import type { OAuthLoginProvider } from '../../oauthConstants.js';

export const oauthLoginManifestProviderFromLayer = (layer: OAuthProviderLayerRaw): OAuthLoginProvider =>
  layer.variant === 'preset'
    ? { type: 'preset', provider: layer.provider }
    : oauthLoginCustomPayloadFromLayer(layer);

const oauthLoginCustomPayloadFromLayer = (
  layer: OAuthProviderCustomLayerRaw,
): Extract<OAuthLoginProvider, { type: 'custom' }> => {
  const text = layer.children.find((c): c is TextLayerRaw => c.kind === 'text');
  const icon = layer.children.find((c): c is IconLayerRaw => c.kind === 'icon');
  return {
    type: 'custom',
    rowId: layer.rowId,
    label: text?.text ?? { default: '' },
    family: icon?.family ?? 'ionicons',
    iconName: icon?.iconName ?? 'help-circle-outline',
  };
};

export const OAuthProviderPresetLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('oauth_provider'),
  variant: z.literal('preset'),
  provider: z.enum(OAUTH_LOGIN_PRESETS),
  label: LocalizedTextSchema.optional(),
  style: OAuthPresetButtonChromeSchema.optional(),
  styleBreakpoints: OAuthPresetButtonChromeBreakpointsSchema.optional(),
});

const migrateOAuthProviderCustomIncoming = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if (o.kind !== 'oauth_provider' || o.variant !== 'custom') return raw;
  const ch = o.children;
  if (Array.isArray(ch) && ch.length > 0) {
    const next = { ...o };
    if (next.buttonVariant === undefined) next.buttonVariant = 'secondary';
    return next;
  }
  const pid = typeof o.id === 'string' ? o.id : 'lyr_oauth_custom';
  const slug = pid.replace(/[^a-z0-9_]/gi, '_').slice(0, 40) || 'oauth';
  const label = o.label ?? { default: 'Custom' };
  let family = (o.family ?? 'ionicons') as string;
  let iconName = (o.iconName ?? 'shield-outline') as string;
  if (family === 'sf_symbol') {
    family = 'ionicons';
    iconName = 'star-outline';
  }
  const cid = slug;
  const iconId = (`lyr_${cid}_ico`).slice(0, 64);
  const textId = (`lyr_${cid}_txt`).slice(0, 64);
  const next: Record<string, unknown> = { ...o };
  delete next.label;
  delete next.family;
  delete next.iconName;
  return {
    ...next,
    buttonVariant: o.buttonVariant ?? 'secondary',
    children: [
      { id: iconId, kind: 'icon', family, iconName },
      { id: textId, kind: 'text', text: label },
    ],
  };
};

const OAuthProviderCustomLayerSchemaValidated = z.object({
  ...baseLayerShape,
  kind: z.literal('oauth_provider'),
  variant: z.literal('custom'),
  rowId: z.string().uuid(),
  buttonVariant: ButtonLayerVariantSchema,
  direction: z.enum(['vertical', 'horizontal']).optional(),
  gap: z.number().int().min(0).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  distribution: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
  children: z.lazy(() => z.array(lazyLayer()).min(1)) as unknown as z.ZodType<LayerRaw[]>,
  style: ButtonStyleSchema.optional(),
  styleBreakpoints: ButtonStyleBreakpointsSchema,
  buttonLayoutBreakpoints: ButtonLayoutBreakpointsSchema,
});

export const OAuthProviderCustomLayerSchema = z.preprocess(
  migrateOAuthProviderCustomIncoming,
  OAuthProviderCustomLayerSchemaValidated,
);

/** Preset/custom share `kind`; keep a flat union (not nested `discriminatedUnion('variant')`) so `lazyLayer()` can discriminate on `kind` + parse correctly. */
export const OAuthProviderLayerSchema = z.union([
  OAuthProviderPresetLayerSchema,
  OAuthProviderCustomLayerSchema,
]);
