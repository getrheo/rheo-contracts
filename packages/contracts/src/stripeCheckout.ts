import { z } from 'zod';
import { StripePaymentLinkUrlSchema } from './externalSurfaces.js';

export const CHECKOUT_ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000;
export const WEB_SDK_ORIGIN_MAX = 20;

export const StripeCheckoutAttemptStatusSchema = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'expired',
]);
export type StripeCheckoutAttemptStatus = z.infer<typeof StripeCheckoutAttemptStatusSchema>;

const AttributionValueSchema = z.union([z.string(), z.number(), z.boolean()]);

/**
 * Exact browser origin (scheme, host, port). `http` is only allowed for localhost.
 * Paths, queries, and credentials are rejected.
 */
export const WebSdkOriginSchema = z.string().min(1).max(200).transform((raw, ctx) => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'origin must be an absolute URL' });
    return z.NEVER;
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'origin must be https, or http://localhost / http://127.0.0.1',
    });
    return z.NEVER;
  }
  if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'origin must be scheme, host, and port only',
    });
    return z.NEVER;
  }
  return url.origin;
});
export type WebSdkOrigin = z.infer<typeof WebSdkOriginSchema>;

export const WebSdkOriginsSchema = z.array(WebSdkOriginSchema).max(WEB_SDK_ORIGIN_MAX);

export const StripeCheckoutAttemptCreateRequestSchema = z.object({
  channelId: z.string().min(1).max(128),
  flowId: z.string().uuid(),
  versionId: z.string().uuid(),
  experimentId: z.string().uuid().nullable().optional(),
  variantId: z.string().min(1).max(128).nullable().optional(),
  surfaceId: z.string().min(1).max(128),
  appUserId: z.string().min(1).max(256),
  paymentLinkUrl: StripePaymentLinkUrlSchema,
  attribution: z.record(z.string(), AttributionValueSchema).optional(),
});
export type StripeCheckoutAttemptCreateRequest = z.infer<
  typeof StripeCheckoutAttemptCreateRequestSchema
>;

export const StripeCheckoutAttemptCreateResponseSchema = z.object({
  attemptId: z.string().uuid(),
  expiresAt: z.string().datetime(),
});
export type StripeCheckoutAttemptCreateResponse = z.infer<
  typeof StripeCheckoutAttemptCreateResponseSchema
>;

export const StripeCheckoutAttemptStatusResponseSchema = z.object({
  attemptId: z.string().uuid(),
  status: StripeCheckoutAttemptStatusSchema,
});
export type StripeCheckoutAttemptStatusResponse = z.infer<
  typeof StripeCheckoutAttemptStatusResponseSchema
>;

/** Whether a stored attempt should still be treated as pending. */
export const effectiveCheckoutAttemptStatus = (params: {
  status: StripeCheckoutAttemptStatus;
  expiresAt: Date;
  now?: Date;
}): StripeCheckoutAttemptStatus => {
  if (params.status === 'pending' && params.expiresAt.getTime() <= (params.now ?? new Date()).getTime()) {
    return 'expired';
  }
  return params.status;
};

/**
 * Webhook confirm decision. A second event for an already-confirmed attempt is a no-op.
 * Cancelled attempts can still confirm: the customer may have paid after Back.
 */
export const checkoutConfirmDecision = (params: {
  exists: boolean;
  status: StripeCheckoutAttemptStatus;
}): 'confirm' | 'duplicate' | 'missing' => {
  if (!params.exists) return 'missing';
  if (params.status === 'confirmed') return 'duplicate';
  return 'confirm';
};
