import { z } from 'zod';
import { ScreenIdSchema } from './ids.js';

/** Authorable OS-facing permission capabilities; additive via schema bumps only. */
export const OS_PERMISSION_KEYS = [
  'notifications',
  'camera',
  'microphone',
  'photo_library',
  'contacts',
  'calendar',
  'reminders',
  'location_when_in_use',
  'location_always',
  'motion',
  'bluetooth',
  'app_tracking_transparency',
  'speech_recognition',
  'face_id',
  'health_kit',
  'media_library',
  'local_network',
  'nearby_interactions',
  'nfc',
  'full_screen_intent_android',
  'sms_android',
  'phone_android',
] as const;
export type OsPermissionKey = (typeof OS_PERMISSION_KEYS)[number];

export const OsPermissionKeySchema = z.enum(OS_PERMISSION_KEYS);

export const PERMISSION_CAPTURE_FIELD_KEY_PREFIX = 'permission:' as const;

export const permissionCaptureFieldKey = (key: OsPermissionKey): `${typeof PERMISSION_CAPTURE_FIELD_KEY_PREFIX}${OsPermissionKey}` =>
  `${PERMISSION_CAPTURE_FIELD_KEY_PREFIX}${key}`;

/** Storage key for `oauth_login_resolve` step responses (avoids `fieldKey` collisions). */
export const oauthLoginResponseKey = (layerId: string): string => `oauth:${layerId}`;

/** Storage key for `email_password_auth_resolve` step responses (avoids `fieldKey` collisions). */
export const emailPasswordAuthResponseKey = (layerId: string): string => `email_pw:${layerId}`;

export const PERMISSION_OUTCOME_VALUES = ['granted', 'denied', 'blocked'] as const;
export type PermissionOutcome = (typeof PERMISSION_OUTCOME_VALUES)[number];
export const PermissionOutcomeSchema = z.enum(PERMISSION_OUTCOME_VALUES);

/** Sentinel: branch follows this screen's `next.default` (same as a Continue button). */
export const OS_PERMISSION_OUTCOME_CONTINUE = 'continue' as const;
/** Sentinel: complete the flow after this permission outcome (no next screen). */
export const OS_PERMISSION_OUTCOME_END = 'end' as const;

export const OsPermissionOutcomeBranchTargetSchema = z.union([
  ScreenIdSchema,
  z.literal(OS_PERMISSION_OUTCOME_CONTINUE),
  z.literal(OS_PERMISSION_OUTCOME_END),
]);

export type OsPermissionOutcomeBranchTarget = z.infer<typeof OsPermissionOutcomeBranchTargetSchema>;

const OsPermissionOutcomesSchema = z
  .object({
    granted: OsPermissionOutcomeBranchTargetSchema,
    denied: OsPermissionOutcomeBranchTargetSchema,
    blocked: OsPermissionOutcomeBranchTargetSchema,
  })
  .strict();

export type OsPermissionBranchOutcomes = z.infer<typeof OsPermissionOutcomesSchema>;

export const APP_REVIEW_CAPTURE_FIELD_KEY_PREFIX = 'app_review:' as const;

export const appReviewCaptureFieldKey = (layerId: string): `${typeof APP_REVIEW_CAPTURE_FIELD_KEY_PREFIX}${string}` =>
  `${APP_REVIEW_CAPTURE_FIELD_KEY_PREFIX}${layerId}`;

export const APP_REVIEW_OUTCOMES = ['not_shown', 'dismissed'] as const;
export type AppReviewOutcome = (typeof APP_REVIEW_OUTCOMES)[number];
export const AppReviewOutcomeSchema = z.enum(APP_REVIEW_OUTCOMES);

export const ButtonActionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('continue') }),
  z.object({ kind: z.literal('skip') }),
  z.object({ kind: z.literal('end_flow') }),
  z.object({
    kind: z.literal('go_back_one_screen'),
    fallbackScreenId: ScreenIdSchema.optional(),
  }),
  z.object({ kind: z.literal('go_to_step'), screenId: ScreenIdSchema }),
  z.object({
    kind: z.literal('request_os_permission'),
    permissionKey: OsPermissionKeySchema,
    outcomes: OsPermissionOutcomesSchema,
  }),
  z.object({
    kind: z.literal('play_media'),
    targetLayerIds: z.array(z.string().min(1)).min(1),
  }),
  z.object({ kind: z.literal('request_app_review') }),
]);
export type ButtonAction = z.infer<typeof ButtonActionSchema>;

export const TEXT_INPUT_TYPES = ['plain', 'email', 'phone', 'url', 'multiline'] as const;
export type TextInputType = (typeof TEXT_INPUT_TYPES)[number];
export const TextInputTypeSchema = z.enum(TEXT_INPUT_TYPES);

export const COUNTER_DISPLAY_KINDS = ['number', 'time'] as const;
export type CounterDisplayKind = (typeof COUNTER_DISPLAY_KINDS)[number];

/** Clock-style layout when {@link CounterLayerRaw.displayKind} is `time`; values are total seconds. */
export const COUNTER_TIME_FORMATS = ['mm_ss', 'hh_mm_ss', 'dd_hh_mm_ss'] as const;
export type CounterTimeFormat = (typeof COUNTER_TIME_FORMATS)[number];
