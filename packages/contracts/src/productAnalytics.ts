import { z } from 'zod';
import { SdkContextSchema, SdkIdentitySchema } from './identity';
import { SdkTrackPropertyValueSchema } from './track';

/** Inactivity window after which the next product-analytics event starts a session. */
export const PRODUCT_ANALYTICS_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const PRODUCT_ANALYTICS_STORAGE_KEYS = {
  sessionId: 'rheo_product_analytics_session_id',
  lastActivityAt: 'rheo_product_analytics_session_last_at',
  firstSent: 'rheo_product_analytics_first_sent',
} as const;

export const PRODUCT_ANALYTICS_MAX_BATCH = 500;
export const PRODUCT_ANALYTICS_MAX_PROPERTIES_BYTES = 32 * 1024;
export const PRODUCT_ANALYTICS_MAX_SCREEN_NAME = 200;

const propertiesSchema = z
  .record(z.string(), SdkTrackPropertyValueSchema)
  .optional()
  .superRefine((value, ctx) => {
    if (value === undefined) return;
    if (JSON.stringify(value).length > PRODUCT_ANALYTICS_MAX_PROPERTIES_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'properties exceed 32KB',
        path: ['properties'],
      });
    }
  });

/**
 * One product-analytics event. Free-string name, no flow ids.
 * Does not write the funnel Enum table or Engage segment events.
 */
export const SdkProductAnalyticsEventSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  timestamp: z.string().datetime(),
  identity: SdkIdentitySchema,
  context: SdkContextSchema.optional(),
  screenName: z.string().trim().min(1).max(PRODUCT_ANALYTICS_MAX_SCREEN_NAME).optional(),
  properties: propertiesSchema,
});
export type SdkProductAnalyticsEvent = z.infer<typeof SdkProductAnalyticsEventSchema>;

export const SdkProductAnalyticsBatchSchema = z.object({
  events: z.array(SdkProductAnalyticsEventSchema).min(1).max(PRODUCT_ANALYTICS_MAX_BATCH),
});
export type SdkProductAnalyticsBatch = z.infer<typeof SdkProductAnalyticsBatchSchema>;

export const SdkProductAnalyticsResponseSchema = z.object({
  accepted: z.literal(true),
});
export type SdkProductAnalyticsResponse = z.infer<typeof SdkProductAnalyticsResponseSchema>;

export type ProductAnalyticsStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
};

export type ProductAnalyticsSessionAdvance = {
  sessionId: string;
  started: boolean;
};

/** Continue the stored session, or start a new one after 30 minutes of inactivity. */
export const advanceProductAnalyticsSession = async (
  storage: ProductAnalyticsStorage,
  nowMs: number,
  createId: () => string,
): Promise<ProductAnalyticsSessionAdvance> => {
  const [storedId, storedLast] = await Promise.all([
    storage.get(PRODUCT_ANALYTICS_STORAGE_KEYS.sessionId),
    storage.get(PRODUCT_ANALYTICS_STORAGE_KEYS.lastActivityAt),
  ]);
  const lastMs = storedLast === null ? Number.NaN : Number(storedLast);
  const age = nowMs - lastMs;
  const fresh = Boolean(storedId) && Number.isFinite(lastMs) && age >= 0 && age < PRODUCT_ANALYTICS_SESSION_TIMEOUT_MS;
  const sessionId = fresh && storedId ? storedId : createId();
  await Promise.all([
    storage.set(PRODUCT_ANALYTICS_STORAGE_KEYS.sessionId, sessionId),
    storage.set(PRODUCT_ANALYTICS_STORAGE_KEYS.lastActivityAt, String(nowMs)),
  ]);
  return { sessionId, started: !fresh };
};

/** Returns true the first time this device should emit first_visit or first_open. */
export const claimProductAnalyticsFirstOpen = async (
  storage: ProductAnalyticsStorage,
): Promise<boolean> => {
  const existing = await storage.get(PRODUCT_ANALYTICS_STORAGE_KEYS.firstSent);
  if (existing === '1') return false;
  await storage.set(PRODUCT_ANALYTICS_STORAGE_KEYS.firstSent, '1');
  return true;
};
