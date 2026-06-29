import { z } from 'zod';

export const WIDTH_PRESETS = ['auto', 'full', '1/2', '1/3', '2/3', '1/4', '3/4'] as const;
export type WidthPreset = (typeof WIDTH_PRESETS)[number];

/** Width can be a named preset (`auto`, `full`, fractional) or a fixed pixel value. */
export const WidthValueSchema = z.union([z.enum(WIDTH_PRESETS), z.number().int().min(0).max(2000)]);
export type WidthValue = z.infer<typeof WidthValueSchema>;

/** Height presets: `auto` (content-hug), `full`/`fill` (parent height), or fixed px. No fractional values. */
export const HEIGHT_PRESETS = ['auto', 'full', 'fill'] as const;
export type HeightPreset = (typeof HEIGHT_PRESETS)[number];

export const CommonLayoutHeightSchema = z.union([
  z.enum(HEIGHT_PRESETS),
  z.number().int().min(0).max(2000),
]);
export type CommonLayoutHeight = z.infer<typeof CommonLayoutHeightSchema>;
