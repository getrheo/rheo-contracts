import { z } from 'zod';

export const SdkIdentitySchema = z.object({
  appUserId: z.string().min(1),
  customUserId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
});
export type SdkIdentity = z.infer<typeof SdkIdentitySchema>;

const SdkAttributeValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const SdkContextSchema = z.object({
  platform: z.enum(['ios', 'android', 'web']).optional(),
  appVersion: z.string().optional(),
  locale: z.string().optional(),
  /** Web SDK only. App SDKs leave this empty. */
  browser: z.string().max(80).optional(),
  os: z.string().max(80).optional(),
  device: z.string().max(80).optional(),
  customProperties: z.record(z.string(), SdkAttributeValueSchema).optional(),
  /**
   * Canonical attribution keys (`acquisition.*`, `attribution.*`, `link.*`).
   * Optional. Web sends first-touch; mobile may omit them.
   */
  attribution: z.record(z.string(), SdkAttributeValueSchema).optional(),
});
export type SdkContext = z.infer<typeof SdkContextSchema>;
