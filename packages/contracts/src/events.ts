import { z } from 'zod';
import { EVENT_NAMES } from './constants/index';
import { SdkContextSchema, SdkIdentitySchema } from './identity';

export const EventNameSchema = z.enum(EVENT_NAMES);

export const SdkEventSchema = z.object({
  eventId: z.string().uuid(),
  name: EventNameSchema,
  timestamp: z.string().datetime(),
  flowId: z.string().uuid(),
  /** Resolved version the SDK was rendering when the event occurred. */
  versionId: z.string().uuid(),
  experimentId: z.string().uuid().nullable().optional(),
  variantId: z.string().nullable().optional(),
  stepId: z.string().nullable().optional(),
  identity: SdkIdentitySchema,
  context: SdkContextSchema.optional(),
  properties: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())]),
    )
    .optional(),
  /** for text_submitted, marks this value as sensitive so backend redacts */
  fieldClassification: z.enum(['safe', 'sensitive']).optional(),
});
export type SdkEvent = z.infer<typeof SdkEventSchema>;

export const SdkEventBatchSchema = z.object({
  events: z.array(SdkEventSchema).min(1).max(500),
});
export type SdkEventBatch = z.infer<typeof SdkEventBatchSchema>;
