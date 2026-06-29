import { z } from 'zod';
import { LocalizedTextSchema } from '../../../localized.js';
import { baseLayerShape } from '../../base.js';
import {
  CommonStyleSchema,
  CommonStyleBreakpointsSchema,
  ICON_FAMILIES,
} from '../../styleCommon.js';
import { OAUTH_LOGIN_PRESETS } from '../../oauthConstants.js';
import type { OAuthLoginPreset } from '../../oauthConstants.js';
import type { OAuthProviderLayerRaw } from '../../layerRawTypes.js';
import { OAuthProviderLayerSchema } from './oauthProvider.js';

export const OAuthLoginPresetProviderSchema = z.object({
  type: z.literal('preset'),
  provider: z.enum(OAUTH_LOGIN_PRESETS),
});

export const OAuthLoginCustomProviderSchema = z.object({
  type: z.literal('custom'),
  rowId: z.string().uuid(),
  label: LocalizedTextSchema,
  family: z.enum(ICON_FAMILIES),
  iconName: z.string().min(1).max(128),
});

export const OAuthLoginProviderSchema = z.discriminatedUnion('type', [
  OAuthLoginPresetProviderSchema,
  OAuthLoginCustomProviderSchema,
]);

const oauthLoginChildrenUniquePresets = (
  children: OAuthProviderLayerRaw[],
  ctx: z.RefinementCtx,
): void => {
  const seen = new Set<OAuthLoginPreset>();
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    if (!c || c.kind !== 'oauth_provider' || c.variant !== 'preset') continue;
    const preset = c.provider;
    if (seen.has(preset)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate OAuth preset "${preset}"`,
        path: ['children', i, 'provider'],
      });
      return;
    }
    seen.add(preset);
  }
};

/**
 * Migrate legacy `providers: OAuthLoginProvider[]` to nested `oauth_provider` children so old
 * manifests keep parsing.
 */
const migrateOAuthLoginIncoming = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if (o.kind !== 'oauth_login') return raw;
  if (Array.isArray(o.children) && o.children.length > 0) return raw;
  const provs = o.providers;
  if (!Array.isArray(provs) || provs.length === 0) return raw;

  const pid = typeof o.id === 'string' ? o.id : 'lyr_oauth_legacy';
  const slug = pid
    .replace(/^lyr_/i, '')
    .replace(/[^a-z0-9_]/gi, '_')
    .replace(/^_+/, '')
    .slice(0, 48) || 'oauth';

  type LegacyProv = Record<string, unknown>;
  const children = provs.map((p: unknown, idx: number): Record<string, unknown> => {
    const prov = (p ?? {}) as LegacyProv;
    const cid = (`lyr_${slug}_opr_${idx}`).slice(0, 64);
    if (prov.type === 'preset') {
      return {
        id: cid,
        kind: 'oauth_provider',
        variant: 'preset',
        provider: prov.provider,
      };
    }
    return {
      id: cid,
      kind: 'oauth_provider',
      variant: 'custom',
      rowId: String(prov.rowId),
      buttonVariant: 'secondary',
      children: [
        {
          id: (`${cid}_ico`).slice(0, 64),
          kind: 'icon',
          family: prov.family ?? 'ionicons',
          iconName: String(prov.iconName ?? 'shield'),
        },
        {
          id: (`${cid}_txt`).slice(0, 64),
          kind: 'text',
          text: (prov.label ?? { default: 'Custom' }) as { default: string },
        },
      ],
    };
  });

  const { providers: _omit, ...rest } = o;
  return { ...rest, children };
};

const OAuthLoginLayerSchemaValidated = z.object({
  ...baseLayerShape,
  kind: z.literal('oauth_login'),
  children: z.lazy(() =>
    z.array(OAuthProviderLayerSchema).min(1).superRefine(oauthLoginChildrenUniquePresets),
  ),
  gap: z.number().int().min(0).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});

export const OAuthLoginLayerSchema = z.preprocess(
  migrateOAuthLoginIncoming,
  OAuthLoginLayerSchemaValidated,
);

export const OAuthLoginProvidersArraySchema = z
  .array(OAuthLoginProviderSchema)
  .min(1)
  .superRefine((providers, ctx) => {
    const seen = new Set<OAuthLoginPreset>();
    for (let i = 0; i < providers.length; i++) {
      const p = providers[i];
      if (!p || p.type !== 'preset') continue;
      const preset = p.provider;
      if (seen.has(preset)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate OAuth preset "${preset}"`,
          path: [i, 'provider'],
        });
        return;
      }
      seen.add(preset);
    }
  });
