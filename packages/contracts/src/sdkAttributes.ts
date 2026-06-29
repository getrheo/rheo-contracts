/**
 * Reserved SDK attribute keys that the SDK writes automatically during a
 * flow run. They bypass the manifest's `sdkAttributeKeys` allowlist when
 * referenced from decision nodes so authors can branch on provider state
 * without having to declare each key up front.
 */
export const RESERVED_RC_SDK_KEYS = [
  /** Last RC event observed by the SDK (e.g. `purchase_completed`, `purchase_cancelled`). */
  'onb_rc_last_event',
  /** Product identifier from the most recent successful purchase. */
  'onb_rc_last_product_id',
  /** Period type (`normal`, `intro`, `trial`) from the most recent purchase. */
  'onb_rc_last_period_type',
  /** RevenueCat offering id surfaced by the most recent paywall presentation. */
  'onb_rc_last_offering_id',
] as const;

export type ReservedRcSdkKey = (typeof RESERVED_RC_SDK_KEYS)[number];

const RESERVED_SDK_KEYS_SET: ReadonlySet<string> = new Set<string>(RESERVED_RC_SDK_KEYS);

export const isReservedSdkKey = (key: string): key is ReservedRcSdkKey =>
  RESERVED_SDK_KEYS_SET.has(key);
