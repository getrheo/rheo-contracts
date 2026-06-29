export const ENVIRONMENTS = ['test', 'live'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const ROLES = ['owner', 'editor'] as const;
export type Role = (typeof ROLES)[number];

export const STEP_TYPES = [
  'carousel',
  'single_choice',
  'multiple_choice',
  'text_input',
  'scale_input',
  'cta',
] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const FIELD_CLASSIFICATIONS = ['safe', 'sensitive'] as const;
export type FieldClassification = (typeof FIELD_CLASSIFICATIONS)[number];

export const MEDIA_TYPES = ['image', 'font', 'lottie', 'video'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Lottie sources are JSON on the same CDN as images. */
export const LOTTIE_MIME_TYPES = ['application/json', 'text/json'] as const;
export const MAX_LOTTIE_BYTES = 10 * 1024 * 1024;

/** Video files on the same CDN as images (mp4, webm, mov). */
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const FONT_MIME_TYPES = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/octet-stream',
] as const;
export const FONT_FILE_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2'] as const;
export const MAX_FONT_BYTES = 10 * 1024 * 1024;

export const EVENT_NAMES = [
  'flow_started',
  'step_viewed',
  'step_completed',
  'step_skipped',
  'choice_selected',
  'text_submitted',
  'flow_completed',
  'flow_abandoned',
  'decision_evaluated',
  'external_link_opened',
  'surface_presented',
  'surface_outcome',
  'app_review_prompt_shown',
  'app_review_prompt_dismissed',
  /** Emitted once per provider id when merged SDK attributes first expose that attribution source (used for integration health checks). */
  'attribution_context_observed',
  /** Successful in-app purchase from an external surface (e.g. RevenueCat paywall); commerce fields live in `properties`. */
  'iap_purchase',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export const PUBLISHABLE_KEY_PREFIX = 'ob_pk_';
export const API_VERSION = 'v1';

export const DEFAULT_LOCALE = 'en';

export const AUTOSAVE_DEBOUNCE_MS = 800;
export const SDK_EVENT_FLUSH_MS = 5000;
