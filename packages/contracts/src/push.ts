import { z } from 'zod';

export const SdkPushPlatformSchema = z.enum(['ios', 'android', 'web']);
export type SdkPushPlatform = z.infer<typeof SdkPushPlatformSchema>;

export const SdkPushProviderSchema = z.enum(['apns', 'fcm', 'web_push']);
export type SdkPushProvider = z.infer<typeof SdkPushProviderSchema>;

export const SdkWebPushKeysSchema = z.object({
  endpoint: z.string().trim().url().max(2000),
  p256dh: z.string().trim().min(1).max(200),
  auth: z.string().trim().min(1).max(200),
});
export type SdkWebPushKeys = z.infer<typeof SdkWebPushKeysSchema>;

export const SdkPushRegisterRequestSchema = z
  .object({
    appUserId: z.string().trim().min(1).max(200).optional(),
    platform: SdkPushPlatformSchema,
    provider: SdkPushProviderSchema,
    token: z.string().trim().min(1).max(4096).optional(),
    webPush: SdkWebPushKeysSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.provider === 'web_push') {
      if (!value.webPush) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'webPush is required for web_push',
          path: ['webPush'],
        });
      }
      return;
    }
    if (!value.token) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'token is required',
        path: ['token'],
      });
    }
  });
export type SdkPushRegisterRequest = z.infer<typeof SdkPushRegisterRequestSchema>;

export const SdkPushUnregisterRequestSchema = z
  .object({
    appUserId: z.string().trim().min(1).max(200).optional(),
    token: z.string().trim().min(1).max(4096).optional(),
    endpoint: z.string().trim().url().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.token && !value.endpoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'token or endpoint is required',
        path: ['token'],
      });
    }
  });
export type SdkPushUnregisterRequest = z.infer<typeof SdkPushUnregisterRequestSchema>;

export const SdkPushRegisterResponseSchema = z.object({
  subscriptionId: z.string().uuid(),
  platform: SdkPushPlatformSchema,
  provider: SdkPushProviderSchema,
});
export type SdkPushRegisterResponse = z.infer<typeof SdkPushRegisterResponseSchema>;

export const SdkPushConfigResponseSchema = z.object({
  vapidPublicKey: z.string().nullable(),
});
export type SdkPushConfigResponse = z.infer<typeof SdkPushConfigResponseSchema>;
