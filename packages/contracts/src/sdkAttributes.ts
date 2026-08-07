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

export const RESERVED_SUPERWALL_SDK_KEYS = [
  /** Last Superwall event observed by the SDK (e.g. `purchase_completed`, `dismissed`). */
  'onb_sw_last_event',
  /** Product identifier from the most recent successful Superwall purchase. */
  'onb_sw_last_product_id',
  /** Placement id from the most recent Superwall registration. */
  'onb_sw_last_placement_id',
] as const;

export type ReservedSuperwallSdkKey = (typeof RESERVED_SUPERWALL_SDK_KEYS)[number];

export type ReservedSdkKey = ReservedRcSdkKey | ReservedSuperwallSdkKey;

const RESERVED_SDK_KEYS_SET: ReadonlySet<string> = new Set<string>([
  ...RESERVED_RC_SDK_KEYS,
  ...RESERVED_SUPERWALL_SDK_KEYS,
]);

export const isReservedSdkKey = (key: string): key is ReservedSdkKey =>
  RESERVED_SDK_KEYS_SET.has(key);
