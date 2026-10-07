import { z } from 'zod';
import {
  optionalClearable,
  ProfileCountrySchema,
  ProfileLocaleSchema,
  ProfileNameSchema,
  ProfilePhoneSchema,
} from './customerProfile';
import { IanaTimeZoneSchema } from './timezone';
import { SdkIdentifyAttributesSchema } from './track';

export const MarketingConsentSchema = z.enum(['granted', 'denied', 'unknown']);
export type MarketingConsent = z.infer<typeof MarketingConsentSchema>;

export const MARKETING_CONSENT_ALIAS_CONFLICT =
  'marketingConsent and emailMarketingConsent disagree';

export const marketingConsentAliasDisagrees = (
  marketingConsent: string | undefined,
  emailMarketingConsent: string | undefined,
): boolean =>
  marketingConsent !== undefined &&
  emailMarketingConsent !== undefined &&
  marketingConsent !== emailMarketingConsent;

export const addMarketingConsentAliasIssue = (
  value: { marketingConsent?: string; emailMarketingConsent?: string },
  ctx: z.RefinementCtx,
): void => {
  if (marketingConsentAliasDisagrees(value.marketingConsent, value.emailMarketingConsent)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: MARKETING_CONSENT_ALIAS_CONFLICT,
      path: ['marketingConsent'],
    });
  }
};

export const resolvedMarketingConsent = <T extends string>(
  marketingConsent: T | undefined,
  emailMarketingConsent: T | undefined,
): T | undefined => marketingConsent ?? emailMarketingConsent;

export const SdkIdentifyRequestSchema = z
  .object({
    appUserId: z.string().trim().min(1).max(200),
    email: z.string().trim().email().optional(),
    marketingConsent: MarketingConsentSchema.optional(),
    /** @deprecated Ingest alias. Parsed requests keep marketingConsent only. */
    emailMarketingConsent: MarketingConsentSchema.optional(),
    topicConsents: z.record(z.string().min(1).max(80), MarketingConsentSchema).optional(),
    customUserId: z.string().trim().min(1).max(200).optional(),
    /** Shallow-merged into Customer.attributes (incoming keys overlay). */
    attributes: SdkIdentifyAttributesSchema.optional(),
    /** Blank clears the column. JSON null leaves it unchanged. */
    firstName: optionalClearable(ProfileNameSchema),
    lastName: optionalClearable(ProfileNameSchema),
    phone: optionalClearable(ProfilePhoneSchema),
    locale: optionalClearable(ProfileLocaleSchema),
    country: optionalClearable(ProfileCountrySchema),
    /** Customer IANA timezone for Engage local send / quiet hours (PRD-3). */
    timezone: optionalClearable(IanaTimeZoneSchema),
  })
  .superRefine((value, ctx) => {
    addMarketingConsentAliasIssue(value, ctx);
    const consent = resolvedMarketingConsent(value.marketingConsent, value.emailMarketingConsent);
    if (value.email && consent === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'marketingConsent is required when email is provided',
        path: ['marketingConsent'],
      });
    }
    if (consent === 'granted' && !value.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'email is required when marketingConsent is granted',
        path: ['email'],
      });
    }
  })
  .transform(
    (
      value,
    ): {
      appUserId: string;
      email?: string;
      marketingConsent?: MarketingConsent;
      topicConsents?: Record<string, MarketingConsent>;
      customUserId?: string;
      attributes?: z.infer<typeof SdkIdentifyAttributesSchema>;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      locale?: string | null;
      country?: string | null;
      timezone?: string | null;
    } => {
      const { emailMarketingConsent, marketingConsent, ...rest } = value;
      const resolved = marketingConsent ?? emailMarketingConsent;
      if (resolved === undefined) return rest;
      return { ...rest, marketingConsent: resolved };
    },
  );
export type SdkIdentifyRequest = z.infer<typeof SdkIdentifyRequestSchema>;

export const SdkIdentifyResponseSchema = z.object({
  appUserId: z.string(),
  email: z.string().email().nullable(),
  marketingConsent: MarketingConsentSchema,
  topicConsents: z.record(z.string(), MarketingConsentSchema),
  merged: z.boolean(),
});
export type SdkIdentifyResponse = z.infer<typeof SdkIdentifyResponseSchema>;
