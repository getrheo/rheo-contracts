import { z } from 'zod';
import { SdkContextSchema, SdkIdentitySchema } from './identity';

/**
 * Analytics events for a code channel. Names are free. `experiment_exposed`
 * is logged by the SDK while a code experiment is bucketing. These events
 * are not flow metrics and do not carry flow ids.
 */
export const SdkCodeChannelEventSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(128),
  timestamp: z.string().datetime(),
  experimentId: z.string().uuid().nullable().optional(),
  variantId: z.string().nullable().optional(),
  identity: SdkIdentitySchema,
  context: SdkContextSchema.optional(),
  properties: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});
export type SdkCodeChannelEvent = z.infer<typeof SdkCodeChannelEventSchema>;

export const SdkCodeChannelEventBatchSchema = z.object({
  events: z.array(SdkCodeChannelEventSchema).min(1).max(500),
});
export type SdkCodeChannelEventBatch = z.infer<typeof SdkCodeChannelEventBatchSchema>;

export const EXPERIMENT_EXPOSED_EVENT = 'experiment_exposed' as const;
