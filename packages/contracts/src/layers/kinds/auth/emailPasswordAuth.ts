import { z } from 'zod';
import { LocalizedTextSchema } from '../../../localized.js';
import { FieldKeySchema } from '../../../fields.js';
import { baseLayerShape } from '../../base.js';
import { layerSchemaStore } from '../../layerSchemaRef.js';
const lazyLayer = () => layerSchemaStore.schema!;
import type { LayerRaw } from '../../layerRawTypes.js';
import {
  CommonStyleSchema,
  CommonStyleBreakpointsSchema,
  ButtonStyleSchema,
  ButtonStyleBreakpointsSchema,
  ButtonLayoutBreakpointsSchema,
  ButtonLayerVariantSchema,
} from '../../styleCommon.js';
import { EMAIL_PASSWORD_AUTH_MODES, EMAIL_PASSWORD_SLOTS } from '../../oauthConstants.js';
import type { EmailPasswordAuthMode, EmailPasswordSlot } from '../../oauthConstants.js';

export const EmailPasswordAuthModeSchema = z.enum(EMAIL_PASSWORD_AUTH_MODES);

/** Legacy flat manifests: inflate `children` from label fields once. */
const migrateEmailPasswordAuthIncoming = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if (o.kind !== 'email_password_auth') return raw;
  if (Array.isArray(o.children) && o.children.length > 0) return raw;

  const idBase = typeof o.id === 'string' ? o.id : 'lyr_email_password_auth';
  const slugRaw = idBase.replace(/^lyr_/i, '').replace(/[^a-z0-9_]/gi, '_');
  const slug = slugRaw.length > 0 ? slugRaw.slice(0, 40) : 'ep_auth';
  const mode = o.mode === 'sign_up' ? 'sign_up' : 'sign_in';

  const pickLt = (v: unknown, fallback: string) =>
    v && typeof v === 'object' && v !== null && 'default' in (v as object)
      ? v
      : { default: fallback };

  const mkField = (
    suf: string,
    slot: 'email' | 'password' | 'confirm',
    labelSource: unknown,
    fallbackPlaceholder: string,
  ) =>
    ({
      id: (`lyr_${slug}_fld_${suf}`).slice(0, 64),
      kind: 'email_password_field',
      slot,
      ...(labelSource
        ? { placeholder: pickLt(labelSource, fallbackPlaceholder) }
        : { placeholder: { default: fallbackPlaceholder } }),
      children: [],
    }) as Record<string, unknown>;

  const children: Record<string, unknown>[] = [];
  children.push(mkField('email', 'email', o.emailLabel, 'Email'));
  children.push(mkField('pw', 'password', o.passwordLabel, 'Password'));
  if (mode === 'sign_up') {
    children.push(mkField('cf', 'confirm', o.confirmPasswordLabel, 'Confirm password'));
  }

  const submitLbl =
    o.submitLabel ?? ({ default: mode === 'sign_in' ? 'Sign in' : 'Create account' } as const);
  children.push({
    id: (`lyr_${slug}_submit`).slice(0, 64),
    kind: 'email_password_submit',
    buttonVariant: 'primary',
    direction: 'horizontal',
    align: 'center',
    distribution: 'center',
    gap: 8,
    children: [
      {
        id: (`lyr_${slug}_submit_txt`).slice(0, 64),
        kind: 'text',
        text: submitLbl,
      },
    ],
  });

  const {
    emailLabel: _e,
    passwordLabel: _p,
    confirmPasswordLabel: _c,
    submitLabel: _s,
    ...rest
  } = o;
  return { ...rest, mode, children };
};

const refineEmailPasswordAuthChildren = (
  data: { mode: EmailPasswordAuthMode; children: LayerRaw[] },
  ctx: z.RefinementCtx,
): void => {
  const fields = data.children.filter((c) => c.kind === 'email_password_field');
  const submits = data.children.filter((c) => c.kind === 'email_password_submit');

  const slotSeen = new Set<string>();
  for (const f of fields) {
    if (slotSeen.has(f.slot)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate email_password_field slot "${f.slot}"`,
        path: ['children'],
      });
    }
    slotSeen.add(f.slot);
  }

  const slotHas = new Set(fields.map((f) => f.slot));
  const requiredSlots: EmailPasswordSlot[] =
    data.mode === 'sign_up'
      ? ['email', 'password', 'confirm']
      : ['email', 'password'];
  for (const s of requiredSlots) {
    if (!slotHas.has(s)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.mode === 'sign_up'
            ? `sign_up requires an email_password_field with slot "${s}"`
            : `sign_in requires an email_password_field with slot "${s}"`,
        path: ['children'],
      });
    }
  }
  if (data.mode === 'sign_in' && slotHas.has('confirm')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'sign_in must not include email_password_field with slot "confirm"',
      path: ['children'],
    });
  }

  if (submits.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `email_password_auth must have exactly one email_password_submit (found ${submits.length})`,
      path: ['children'],
    });
  }
};

export const EmailPasswordFieldLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('email_password_field'),
  slot: z.enum(EMAIL_PASSWORD_SLOTS),
  placeholder: LocalizedTextSchema.optional(),
  children: z
    .lazy(() => z.array(lazyLayer()))
    .optional() as unknown as z.ZodType<LayerRaw[] | undefined>,
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});

export const EmailPasswordSubmitLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('email_password_submit'),
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

const EmailPasswordAuthLayerSchemaValidated = z
  .object({
    ...baseLayerShape,
    kind: z.literal('email_password_auth'),
    mode: EmailPasswordAuthModeSchema,
    fieldKey: FieldKeySchema,
    minPasswordLength: z.number().int().min(4).max(128).optional(),
    children: z.lazy(() =>
      z
        .array(z.union([EmailPasswordFieldLayerSchema, EmailPasswordSubmitLayerSchema]))
        .min(1),
    ),
    gap: z.number().int().min(0).optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    style: CommonStyleSchema.optional(),
    styleBreakpoints: CommonStyleBreakpointsSchema,
  })
  .superRefine(refineEmailPasswordAuthChildren);

export const EmailPasswordAuthLayerSchema = z.preprocess(
  migrateEmailPasswordAuthIncoming,
  EmailPasswordAuthLayerSchemaValidated,
);
