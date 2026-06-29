import { z } from 'zod';

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const BrandColorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  /** Hex color, e.g. `#0F172A`. Alpha (8 chars) supported. */
  value: z.string().regex(HEX, 'must be a hex color (#RRGGBB or #RRGGBBAA)'),
});
export type BrandColor = z.infer<typeof BrandColorSchema>;

export const BrandGradientStopSchema = z.object({
  /** 0..1 position along the gradient. */
  offset: z.number().min(0).max(1),
  color: z.string().regex(HEX),
});
export type BrandGradientStop = z.infer<typeof BrandGradientStopSchema>;

export const BrandGradientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  type: z.enum(['linear', 'radial']),
  /** Degrees, used when type === 'linear'. 0 = top → bottom (CSS convention). */
  angle: z.number().min(0).max(360).optional(),
  stops: z.array(BrandGradientStopSchema).min(2),
});
export type BrandGradient = z.infer<typeof BrandGradientSchema>;

export const FontStyleSchema = z.object({
  id: z.string().uuid(),
  /** Numeric CSS font-weight, e.g. 100..900. */
  weight: z.number().int().min(100).max(900),
  italic: z.boolean(),
  /** Optional human label (e.g. "Bold Italic"). */
  label: z.string().max(40).optional(),
  /** MediaAsset id of the uploaded font file. */
  mediaAssetId: z.string().uuid().optional(),
  /** Public URL of the uploaded font file (denormalized for SDK consumption). */
  url: z.string().url().optional(),
  /** Original filename — useful for display. */
  filename: z.string().max(200).optional(),
});
export type FontStyle = z.infer<typeof FontStyleSchema>;

export const FontFamilySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(60),
  styles: z.array(FontStyleSchema),
});
export type FontFamily = z.infer<typeof FontFamilySchema>;

/** Artwork from a store listing or an uploaded image asset URL. */
export const AppIconSchema = z.object({
  url: z.string().url(),
  source: z.enum(['app_store', 'play_store', 'upload']),
});
export type AppIcon = z.infer<typeof AppIconSchema>;

export const BrandingSchema = z.object({
  /** Optional store / marketing icon for this app (shown in dashboard). */
  appIcon: AppIconSchema.optional(),
  colorPresets: z.array(BrandColorSchema),
  gradientPresets: z.array(BrandGradientSchema),
  fontFamilies: z.array(FontFamilySchema),
});
export type Branding = z.infer<typeof BrandingSchema>;

export const EMPTY_BRANDING: Branding = {
  colorPresets: [],
  gradientPresets: [],
  fontFamilies: [],
};
