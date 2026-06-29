import { z } from 'zod';
import { MediaReferenceSchema } from './media.js';
import { ThemedColorSchema } from './layers/themedColor.js';
import { LoaderOnCompleteSchema } from './layers/kinds/chrome.js';
import { PaddingSchema } from './layers/styleCommon.js';

export const SCREEN_BACKGROUND_PLAYBACK_PREFIX = '__screen_bg__:';

/** Stable playback / play_media target id for shell video (not a layer id). */
export const screenBackgroundPlaybackId = (screenId: string): string =>
  `${SCREEN_BACKGROUND_PLAYBACK_PREFIX}${screenId}`;

export const isScreenBackgroundPlaybackId = (id: string): boolean =>
  id.startsWith(SCREEN_BACKGROUND_PLAYBACK_PREFIX);

export const ScreenBackgroundFitSchema = z.enum(['cover', 'contain', 'fill']);
export type ScreenBackgroundFit = z.infer<typeof ScreenBackgroundFitSchema>;

export const ScreenBackgroundScrimSchema = z
  .object({
    color: ThemedColorSchema.optional(),
    opacity: z.number().min(0).max(1).optional(),
  })
  .partial();
export type ScreenBackgroundScrim = z.infer<typeof ScreenBackgroundScrimSchema>;

const screenBackgroundMediaShape = {
  media: MediaReferenceSchema.optional(),
  fit: ScreenBackgroundFitSchema.optional(),
  opacity: z.number().min(0).max(1).optional(),
  scrim: ScreenBackgroundScrimSchema.optional(),
};

export const ScreenBackgroundColorFillSchema = z.object({
  kind: z.literal('color'),
  color: ThemedColorSchema.optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const ScreenBackgroundImageFillSchema = z.object({
  kind: z.literal('image'),
  ...screenBackgroundMediaShape,
});

export const ScreenBackgroundVideoFillSchema = z.object({
  kind: z.literal('video'),
  ...screenBackgroundMediaShape,
  loop: z.boolean().optional(),
  autoPlay: z.boolean().optional(),
  triggerLayerId: z.string().min(1).optional(),
  onComplete: LoaderOnCompleteSchema.optional(),
  audioEnabled: z.boolean().optional(),
});

export const ScreenBackgroundFillSchema = z.discriminatedUnion('kind', [
  ScreenBackgroundColorFillSchema,
  ScreenBackgroundImageFillSchema,
  ScreenBackgroundVideoFillSchema,
]);
export type ScreenBackgroundFill = z.infer<typeof ScreenBackgroundFillSchema>;
export type ScreenBackgroundColorFill = z.infer<typeof ScreenBackgroundColorFillSchema>;
export type ScreenBackgroundImageFill = z.infer<typeof ScreenBackgroundImageFillSchema>;
export type ScreenBackgroundVideoFill = z.infer<typeof ScreenBackgroundVideoFillSchema>;

/** Partial overrides for the active fill (no `kind` — mode is fixed on default containerStyle). */
export const ScreenBackgroundFillPatchSchema = z
  .object({
    color: ThemedColorSchema.optional(),
    fit: ScreenBackgroundFitSchema.optional(),
    opacity: z.number().min(0).max(1).optional(),
    scrim: ScreenBackgroundScrimSchema.optional(),
    loop: z.boolean().optional(),
    autoPlay: z.boolean().optional(),
    triggerLayerId: z.string().min(1).optional(),
    onComplete: LoaderOnCompleteSchema.optional(),
    audioEnabled: z.boolean().optional(),
  })
  .partial();
export type ScreenBackgroundFillPatch = z.infer<typeof ScreenBackgroundFillPatchSchema>;

export const defaultScreenBackgroundColorFill = (): ScreenBackgroundFill => ({
  kind: 'color',
});

export const defaultScreenBackgroundImageFill = (
  mediaAssetId: string,
): ScreenBackgroundFill => ({
  kind: 'image',
  media: { mediaAssetId },
  fit: 'cover',
});

export const defaultScreenBackgroundVideoFill = (
  mediaAssetId: string,
): ScreenBackgroundFill => ({
  kind: 'video',
  media: { mediaAssetId },
  fit: 'cover',
  loop: true,
  autoPlay: true,
  audioEnabled: false,
});

const ScreenContainerBreakpointPatchSchema = z
  .object({
    padding: PaddingSchema.optional(),
    margin: PaddingSchema.optional(),
    insetSafeArea: z.boolean().optional(),
    backgroundFillPatch: ScreenBackgroundFillPatchSchema.optional(),
  })
  .partial();

export const ScreenContainerStyleBreakpointsSchema = z
  .object({
    sm: ScreenContainerBreakpointPatchSchema.optional(),
    md: ScreenContainerBreakpointPatchSchema.optional(),
    lg: ScreenContainerBreakpointPatchSchema.optional(),
    xl: ScreenContainerBreakpointPatchSchema.optional(),
    '2xl': ScreenContainerBreakpointPatchSchema.optional(),
  })
  .partial()
  .optional();
export type ScreenContainerStyleBreakpoints = z.infer<
  typeof ScreenContainerStyleBreakpointsSchema
>;
