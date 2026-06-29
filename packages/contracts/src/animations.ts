import { z } from 'zod';
import { LayerIdSchema } from './layers';

/**
 * Animation IR — strict-parity, normalized keyframes shared by every
 * runtime (web sim, native SDK, future exporters).
 *
 * Design notes:
 * - `tracks` are the source of truth: each `KeyframeTrack` is a sorted
 *   list of `{ t, value }` samples for ONE animatable property. Renderers
 *   interpolate between samples using the segment's `easing` token.
 * - All times are normalized 0..1; the clip's authored duration lives in
 *   `durationMs`. This keeps schema purely numeric and renderer math
 *   identical (CSS keyframes, Reanimated `withTiming` chains, etc.).
 * - `triggers`: `mount` (layer appears), `unmount` (layer hides — timed on
 *   the screen timeline), and legacy `stagger` (migrated to `mount` + delay
 *   in the builder). Transitions between screens remain `ScreenTransition`.
 * - Property surface is intentionally narrow ("style tokens only") so
 *   strict parity holds across web + RN. Adding a property here means
 *   adding interpreter support in BOTH renderers.
 */

export const ANIMATABLE_PROPERTIES = [
  'opacity',
  'translateX',
  'translateY',
  'scale',
] as const;
export type AnimatableProperty = (typeof ANIMATABLE_PROPERTIES)[number];
export const AnimatablePropertySchema = z.enum(ANIMATABLE_PROPERTIES);

export const EASING_TOKENS = [
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'standard',
  'emphasized',
] as const;
export type EasingToken = (typeof EASING_TOKENS)[number];
export const EasingTokenSchema = z.enum(EASING_TOKENS);

/** A single sample on a property track. */
export const KeyframeSchema = z
  .object({
    t: z.number().min(0).max(1),
    value: z.number(),
    /** Easing applied from this keyframe to the next; defaults to linear. */
    easing: EasingTokenSchema.optional(),
  })
  .strict();
export type Keyframe = z.infer<typeof KeyframeSchema>;

export const KeyframeTrackSchema = z
  .object({
    property: AnimatablePropertySchema,
    keyframes: z.array(KeyframeSchema).min(2),
  })
  .strict()
  .superRefine((track, ctx) => {
    let last = -Infinity;
    for (const k of track.keyframes) {
      if (k.t < last) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `keyframe times must be monotonically non-decreasing on track "${track.property}"`,
        });
        return;
      }
      last = k.t;
    }
    if (track.keyframes[0]!.t !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `track "${track.property}" first keyframe must start at t=0`,
      });
    }
    if (track.keyframes[track.keyframes.length - 1]!.t !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `track "${track.property}" last keyframe must end at t=1`,
      });
    }
  });
export type KeyframeTrack = z.infer<typeof KeyframeTrackSchema>;

export const ANIMATION_TRIGGERS = ['mount', 'stagger', 'unmount'] as const;
export type AnimationTrigger = (typeof ANIMATION_TRIGGERS)[number];
export const AnimationTriggerSchema = z.enum(ANIMATION_TRIGGERS);

export const AnimationClipSchema = z
  .object({
    id: z.string().min(1).max(64),
    targetLayerId: LayerIdSchema,
    trigger: AnimationTriggerSchema,
    /** Position in the screen's stagger order. Required when trigger is `stagger`. */
    staggerIndex: z.number().int().min(0).max(64).optional(),
    /** Total clip duration in milliseconds (renderer scales 0..1 keyframes by this). */
    durationMs: z.number().int().min(0).max(3_600_000),
    /** Pre-roll delay before the clip begins, in ms. Stagger adds on top of this. */
    delayMs: z.number().int().min(0).max(3_600_000).optional(),
    tracks: z.array(KeyframeTrackSchema).min(1),
  })
  .strict()
  .superRefine((clip, ctx) => {
    if (clip.trigger === 'unmount' && clip.staggerIndex !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `clip "${clip.id}" with trigger "unmount" must not set staggerIndex`,
        path: ['staggerIndex'],
      });
    }
    if (clip.trigger === 'stagger' && clip.staggerIndex === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `clip "${clip.id}" with trigger "stagger" must define staggerIndex`,
        path: ['staggerIndex'],
      });
    }
    const seenProps = new Set<AnimatableProperty>();
    for (const track of clip.tracks) {
      if (seenProps.has(track.property)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `clip "${clip.id}" has duplicate track for property "${track.property}"`,
        });
      }
      seenProps.add(track.property);
    }
  });
export type AnimationClip = z.infer<typeof AnimationClipSchema>;

/** Default clip duration when the builder adds mount/unmount animations. */
export const DEFAULT_ANIMATION_CLIP_DURATION_MS = 500 as const;

/**
 * Default gap between siblings when a screen uses `stagger`. The
 * renderer multiplies this by `staggerIndex` and adds it to the clip's
 * `delayMs`. Lives on the screen so authors can dial overall pacing.
 */
export const ScreenStaggerSchema = z
  .object({
    /** Per-index delay multiplier in ms. */
    stepMs: z.number().int().min(0).max(2_000),
  })
  .strict();
export type ScreenStagger = z.infer<typeof ScreenStaggerSchema>;
