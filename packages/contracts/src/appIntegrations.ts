import { z } from 'zod';

export type RevenueCatIntegration = {
  enabled: boolean;
  defaultOfferingId: string;
  defaultPlacementId: string;
};

export type AppsFlyerIntegration = {
  enabled: boolean;
};

export type ResolvedAppIntegrations = {
  revenuecat: RevenueCatIntegration;
  appsflyer: AppsFlyerIntegration;
};

const DEFAULT_REVENUECAT: RevenueCatIntegration = {
  enabled: false,
  defaultOfferingId: '',
  defaultPlacementId: '',
};

const DEFAULT_APPSFLYER: AppsFlyerIntegration = {
  enabled: false,
};

const DEFAULT_INTEGRATIONS: ResolvedAppIntegrations = {
  revenuecat: DEFAULT_REVENUECAT,
  appsflyer: DEFAULT_APPSFLYER,
};

export const parseAppIntegrations = (raw: unknown | null | undefined): ResolvedAppIntegrations => {
  const parsed = AppIntegrationsSchema.safeParse(raw);
  if (!parsed.success) return DEFAULT_INTEGRATIONS;
  return {
    revenuecat: { ...DEFAULT_REVENUECAT, ...parsed.data.revenuecat },
    appsflyer: { ...DEFAULT_APPSFLYER, ...parsed.data.appsflyer },
  };
};

export const APP_INTEGRATIONS_DEFAULTS: ResolvedAppIntegrations = DEFAULT_INTEGRATIONS;

export const RevenueCatIntegrationSchema = z.object({
  enabled: z.boolean(),
  defaultOfferingId: z.string(),
  defaultPlacementId: z.string(),
});

export const AppsFlyerIntegrationSchema = z.object({
  enabled: z.boolean(),
});

export const ResolvedAppIntegrationsSchema = z.object({
  revenuecat: RevenueCatIntegrationSchema,
  appsflyer: AppsFlyerIntegrationSchema,
});

export const AppIntegrationsSchema = z
  .object({
    revenuecat: RevenueCatIntegrationSchema.partial().optional(),
    appsflyer: AppsFlyerIntegrationSchema.partial().optional(),
  })
  .passthrough();

/** Dashboard-only: attribution integrations we can probe for telemetry signals (extend when adding MMPs). */
export const DASHBOARD_ATTRIBUTION_INTEGRATION_PROVIDER_IDS = ['appsflyer'] as const;
export type DashboardAttributionIntegrationProviderId =
  (typeof DASHBOARD_ATTRIBUTION_INTEGRATION_PROVIDER_IDS)[number];

export const DashboardAttributionIntegrationProviderIdSchema = z.enum(
  DASHBOARD_ATTRIBUTION_INTEGRATION_PROVIDER_IDS,
);

export const AttributionProviderSignalQuerySchema = z.object({
  provider: DashboardAttributionIntegrationProviderIdSchema,
});

export const AttributionProviderSignalResponseSchema = z.object({
  provider: z.string(),
  signalDetected: z.boolean(),
  /** `false` when ClickHouse was unavailable or the query failed — treat as inconclusive. */
  checked: z.boolean(),
  matchCount: z.number().int().nonnegative(),
  /** ISO-8601 from ClickHouse `max(timestamp)`, or null when there are no matches. */
  lastSeenAt: z.string().nullable(),
});
export type AttributionProviderSignalResponse = z.infer<typeof AttributionProviderSignalResponseSchema>;
