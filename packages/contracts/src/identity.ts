import { z } from 'zod';

export const SdkIdentitySchema = z.object({
  appUserId: z.string().min(1),
  customUserId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
});
export type SdkIdentity = z.infer<typeof SdkIdentitySchema>;

export const SdkContextSchema = z.object({
  platform: z.enum(['ios', 'android', 'web']).optional(),
  appVersion: z.string().optional(),
  locale: z.string().optional(),
  customProperties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type SdkContext = z.infer<typeof SdkContextSchema>;
