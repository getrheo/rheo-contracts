import { z } from 'zod';

/** Continuous layer motion presets; orthogonal to keyed mount/unmount clips. */
export const RESTING_MOTION_PRESETS = ['translate', 'bounce', 'scale', 'pulse', 'rotate'] as const;
export type RestingMotionPreset = (typeof RESTING_MOTION_PRESETS)[number];
export const RestingMotionPresetSchema = z.enum(RESTING_MOTION_PRESETS);

export const RESTING_MOTION_SCALE_DIRECTIONS = ['up', 'down'] as const;
export type RestingMotionScaleDirection = (typeof RESTING_MOTION_SCALE_DIRECTIONS)[number];
export const RestingMotionScaleDirectionSchema = z.enum(RESTING_MOTION_SCALE_DIRECTIONS);

export const RESTING_MOTION_ROTATE_DIRECTIONS = ['clockwise', 'counterclockwise'] as const;
export type RestingMotionRotateDirection = (typeof RESTING_MOTION_ROTATE_DIRECTIONS)[number];
export const RestingMotionRotateDirectionSchema = z.enum(RESTING_MOTION_ROTATE_DIRECTIONS);

export const RestingMotionSchema = z
  .object({
    preset: RestingMotionPresetSchema,
    /**
     * Timeline segment length (ms): motion is active from start until
     * start + durationMs. When {@link loop} is true, the preset pattern repeats
     * every {@link cycleDurationMs} (or preset default) within this window.
     */
    durationMs: z.number().int().min(200).max(20_000).optional(),
    /** When true, repeat the motion pattern within the timeline segment; default is one shot. */
    loop: z.boolean().optional(),
    /**
     * Duration (ms) of one full pattern cycle when looping. Defaults per {@link RESTING_MOTION_DEFAULT_DURATION_MS}.
     */
    cycleDurationMs: z.number().int().min(200).max(20_000).optional(),
    intensity: z.number().min(0).max(2).optional(),
    /** Bounce preset only: vertical lift in px. When omitted, uses `14 * intensity` (default intensity 1 → 14). */
    bounceAmplitudePx: z.number().min(1).max(80).optional(),
    /** Scale preset: grow (+) or shrink (−) toward a peak, then return to 100%. */
    scaleDirection: RestingMotionScaleDirectionSchema.optional(),
    /**
     * Scale preset: when true (default), each cycle goes rest → peak scale → rest.
     * When false, ramps rest → peak and holds; with loop, the next cycle restarts from rest.
     */
    scaleSpringBack: z.boolean().optional(),
    /**
     * Scale preset: magnitude in % — growth above 100% (up to +400% = 5× at peak) or shrink toward
     * 100%− (up to 90% so peak can be 10% size). See authoring caps in the layer editor.
     */
    scalePercent: z.number().min(0).max(400).optional(),
    /**
     * Scale preset: ms for one full out-and-back (rest → peak → rest). Timeline bar still sets
     * {@link durationMs} (when the layer may animate); this controls how fast each cycle runs.
     */
    scalePatternDurationMs: z.number().int().min(200).max(20_000).optional(),
    /** @deprecated Use {@link scalePercent} + {@link scaleDirection}. Kept for legacy manifests. */
    scaleUpPercent: z.number().min(0).max(400).optional(),
    /** @deprecated Use {@link scalePercent} + {@link scaleDirection}. Kept for legacy manifests. */
    scaleDownPercent: z.number().min(0).max(90).optional(),
    /**
     * @deprecated Legacy vertical-only float (px). Prefer {@link translatePeakXPercent} / {@link translatePeakYPercent}.
     */
    translateRangePx: z.number().min(0).max(40).optional(),
    /** @deprecated Legacy peak offsets in px. Prefer {@link translatePeakXPercent} / {@link translatePeakYPercent}. */
    translatePeakXPx: z.number().min(-200).max(200).optional(),
    /** @deprecated Legacy peak offsets in px. Prefer {@link translatePeakXPercent} / {@link translatePeakYPercent}. */
    translatePeakYPx: z.number().min(-200).max(200).optional(),
    /** Translate preset: peak X offset as % of the layer box (−200–200). Scaled by intensity. */
    translatePeakXPercent: z.number().min(-200).max(200).optional(),
    /** Translate preset: peak Y offset as % of the layer box (−200–200). Scaled by intensity. */
    translatePeakYPercent: z.number().min(-200).max(200).optional(),
    /**
     * Translate preset: when true (default), each cycle goes rest → peak offset → rest. When false, ramp to
     * peak and hold; with loop, the next cycle restarts from the origin.
     */
    translateSpringBack: z.boolean().optional(),
    /** Rotate preset: target rotation in degrees (0–360), scaled by intensity. */
    rotateMaxDeg: z.number().min(0).max(360).optional(),
    /** Rotate preset: spin direction; omitted or `clockwise` → positive angles (default). */
    rotateDirection: RestingMotionRotateDirectionSchema.optional(),
    /**
     * Rotate preset: when true (default), each cycle oscillates 0° → peak → 0°.
     * When false, each cycle ramps 0° → peak and holds; with loop, the next cycle snaps to 0° and ramps again.
     */
    rotateSpringBack: z.boolean().optional(),
    /** Pulse preset: minimum opacity at the dip (0–1). Omitted → `1 - 0.38 * intensity`. */
    pulseMinOpacity: z.number().min(0).max(1).optional(),
    /** Ms after the last mount/stagger clip ends before motion applies (authoring + scrub). */
    delayMsAfterMountEnd: z.number().int().min(0).max(60_000).optional(),
    /**
     * Absolute start time (ms from screen mount). When set, overrides
     * {@link delayMsAfterMountEnd} + mount-clip end so motion can sit between
     * clips (e.g. after first entry, before exit) when multiple mounts exist.
     */
    timelineStartMs: z.number().int().min(0).max(3_600_000).optional(),
  })
  .strict();
export type RestingMotion = z.infer<typeof RestingMotionSchema>;

/** One timeline motion segment on a layer; `id` disambiguates multiple motions per layer. */
export const RestingMotionEntrySchema = RestingMotionSchema.extend({
  id: z.string().min(1),
});
export type RestingMotionEntry = z.infer<typeof RestingMotionEntrySchema>;
