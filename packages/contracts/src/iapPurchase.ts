import { z } from 'zod';

/**
 * Period type observed on the purchased package (when the store SDK exposes it).
 * Mirrors RevenueCat's `PeriodType` semantics without binding to provider-specific strings.
 */
export const IapPurchasePeriodTypeSchema = z.enum(['normal', 'intro', 'trial']);
export type IapPurchasePeriodType = z.infer<typeof IapPurchasePeriodTypeSchema>;

/**
 * Properties carried on the `iap_purchase` SDK event. Emitted by the SDK only
 * on a successful purchase from an external surface (e.g. RevenueCat paywall).
 *
 * `price` and `currency` are the localized gross store price observed at purchase
 * time. `price_usd` is computed server-side at ingest from a daily FX table and
 * MUST NOT be sent by the SDK.
 */
export const IapPurchaseEventPropertiesSchema = z
  .object({
    /** External surface provider that produced the purchase. */
    provider: z.literal('revenuecat'),
    /** Manifest node id of the surface (e.g. `surf_paywall_welcome`). */
    surface_node_id: z.string().min(1).max(128),
    /** Store product identifier (e.g. `pro_annual`). */
    product_id: z.string().min(1).max(256),
    /** Optional RevenueCat offering id (manifest config or RC metadata). */
    offering_id: z.string().min(1).max(128).optional(),
    /** Optional RevenueCat package identifier within the offering (e.g. `$rc_annual`). */
    package_id: z.string().min(1).max(128).optional(),
    /** Localized gross store price at purchase time (non-negative). */
    price: z.number().nonnegative().optional(),
    /** ISO 4217 currency code (e.g. `USD`, `EUR`). Stored uppercase. */
    currency: z
      .string()
      .regex(/^[A-Za-z]{3}$/, 'currency must be a 3-letter ISO 4217 code')
      .transform((s) => s.toUpperCase())
      .optional(),
    /** Period type when known. */
    period_type: IapPurchasePeriodTypeSchema.optional(),
  })
  .refine(
    (v) => (v.price === undefined) === (v.currency === undefined),
    {
      message: 'price and currency must be provided together',
      path: ['price'],
    },
  );
export type IapPurchaseEventProperties = z.infer<typeof IapPurchaseEventPropertiesSchema>;

/**
 * Server-enriched properties stored on the ClickHouse row. Adds `price_usd`
 * (and an `fx_unavailable` flag when FX lookup failed). The SDK never sets
 * these — ingest strips/overrides them.
 */
export const IapPurchaseStoredPropertiesSchema = IapPurchaseEventPropertiesSchema.innerType()
  .extend({
    /** USD-normalized price computed server-side from daily FX rates. Null when FX missing. */
    price_usd: z.number().nonnegative().nullable().optional(),
    /** True when client provided price + currency but FX conversion was unavailable. */
    fx_unavailable: z.boolean().optional(),
  });
export type IapPurchaseStoredProperties = z.infer<typeof IapPurchaseStoredPropertiesSchema>;
