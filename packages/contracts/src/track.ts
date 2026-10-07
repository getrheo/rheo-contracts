import { z } from 'zod';
import { SdkContextSchema, SdkIdentitySchema } from './identity';

/** Property value union shared with SdkEvent (no nested objects). */
export const SdkTrackPropertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
]);

/**
 * Custom behavioral event (Engage signal). Free-string name; no flow/version ids.
 * Does not write the closed-enum analytics `events` table.
 */
export const SdkTrackRequestSchema = z
  .object({
    eventId: z.string().uuid(),
    name: z.string().trim().min(1).max(120),
    timestamp: z.string().datetime(),
    identity: SdkIdentitySchema,
    context: SdkContextSchema.optional(),
    properties: z.record(z.string(), SdkTrackPropertyValueSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.properties === undefined) return;
    const encoded = JSON.stringify(value.properties);
    if (encoded.length > 32 * 1024) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'properties exceed 32KB',
        path: ['properties'],
      });
    }
  });
export type SdkTrackRequest = z.infer<typeof SdkTrackRequestSchema>;

export const SdkTrackResponseSchema = z.object({
  accepted: z.literal(true),
});
export type SdkTrackResponse = z.infer<typeof SdkTrackResponseSchema>;

/** Bounded Customer attributes on SDK identify (shallow-merged server-side). */
export const SdkIdentifyAttributesSchema = z
  .record(z.string().min(1).max(80), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .superRefine((value, ctx) => {
    const keys = Object.keys(value);
    if (keys.length > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'attributes exceed 50 keys',
      });
    }
    const encoded = JSON.stringify(value);
    if (encoded.length > 10 * 1024) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'attributes exceed 10KB',
      });
    }
  });
export type SdkIdentifyAttributes = z.infer<typeof SdkIdentifyAttributesSchema>;
