import { z } from 'zod';

export const BillingIdentityProviderSchema = z.enum(['revenuecat', 'superwall']);
export type BillingIdentityProvider = z.infer<typeof BillingIdentityProviderSchema>;

/** Host-reported billing id. The SDK does not import RevenueCat or Superwall. */
export const SdkBillingIdentityRequestSchema = z.object({
  appUserId: z.string().trim().min(1).max(200),
  provider: BillingIdentityProviderSchema,
  externalId: z.string().trim().min(1).max(256),
});
export type SdkBillingIdentityRequest = z.infer<typeof SdkBillingIdentityRequestSchema>;

export const SdkBillingIdentityResponseSchema = z.object({
  appUserId: z.string(),
  provider: BillingIdentityProviderSchema,
});
export type SdkBillingIdentityResponse = z.infer<typeof SdkBillingIdentityResponseSchema>;
