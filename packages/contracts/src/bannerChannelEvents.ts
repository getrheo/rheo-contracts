import { z } from 'zod';
import { SdkContextSchema, SdkIdentitySchema } from './identity';

export const BANNER_IMPRESSION_EVENT = 'banner_impression' as const;
export const BANNER_DISMISSED_EVENT = 'banner_dismissed' as const;

export const SdkBannerChannelEventSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(128),
  timestamp: z.string().datetime(),
  bannerId: z.string().uuid(),
  versionId: z.string().uuid(),
  channelId: z.string().min(1),
  experimentId: z.string().uuid().nullable().optional(),
  variantId: z.string().nullable().optional(),
  identity: SdkIdentitySchema,
  context: SdkContextSchema.optional(),
  properties: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});
export type SdkBannerChannelEvent = z.infer<typeof SdkBannerChannelEventSchema>;

export const SdkBannerChannelEventBatchSchema = z.object({
  events: z.array(SdkBannerChannelEventSchema).min(1).max(500),
});
export type SdkBannerChannelEventBatch = z.infer<typeof SdkBannerChannelEventBatchSchema>;
