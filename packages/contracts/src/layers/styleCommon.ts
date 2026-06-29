import { z } from 'zod';
import { ThemedColorSchema } from './themedColor.js';
import {
  WIDTH_PRESETS,
  WidthValueSchema,
  HEIGHT_PRESETS,
  CommonLayoutHeightSchema,
  type WidthPreset,
  type WidthValue,
  type HeightPreset,
  type CommonLayoutHeight,
} from '../layerLayout/width.js';

export { ThemedColorSchema } from './themedColor.js';
export type { ThemedColor } from './themedColor.js';

/** Pixel distances for padding, margin, inset, gap, spacing, etc. */
export const NonNegativePxSchema = z.number().int().min(0);

export const PaddingSchema = z
  .object({
    t: NonNegativePxSchema.optional(),
    r: NonNegativePxSchema.optional(),
    b: NonNegativePxSchema.optional(),
    l: NonNegativePxSchema.optional(),
  })
  .partial();
export type Padding = z.infer<typeof PaddingSchema>;

export const BorderSchema = z
  .object({
    width: z.number().int().min(0).max(20).optional(),
    color: ThemedColorSchema.optional(),
  })
  .partial();
export type Border = z.infer<typeof BorderSchema>;

/** CSS-like drop shadow (maps to `boxShadow` on web, shadow* props on native). */
export const DropShadowSchema = z
  .object({
    offsetX: z.number().int().min(-100).max(100).optional(),
    offsetY: z.number().int().min(-100).max(100).optional(),
    blur: z.number().int().min(0).max(100).optional(),
    spread: z.number().int().min(-50).max(50).optional(),
    color: ThemedColorSchema.optional(),
    opacity: z.number().min(0).max(1).optional(),
  })
  .partial();
export type DropShadow = z.infer<typeof DropShadowSchema>;

export type { WidthPreset, WidthValue, HeightPreset, CommonLayoutHeight };
export { WIDTH_PRESETS, WidthValueSchema, HEIGHT_PRESETS, CommonLayoutHeightSchema };
export const CommonStyleSchema = z
  .object({
    padding: PaddingSchema.optional(),
    margin: PaddingSchema.optional(),
    radius: z.number().int().min(0).max(96).optional(),
    background: ThemedColorSchema.optional(),
    border: BorderSchema.optional(),
    shadow: DropShadowSchema.optional(),
    opacity: z.number().min(0).max(1).optional(),
    width: WidthValueSchema.optional(),
    /** Omit for normal flow; `'absolute'` removes the layer from flex flow (non-root only). */
    position: z.literal('absolute').optional(),
    /** Pixel insets when `position === 'absolute'` (same shape as padding). */
    inset: PaddingSchema.optional(),
    zIndex: z.number().int().min(-999).max(999).optional(),
    /** Static rotation in degrees (CSS `rotate`); not timeline animation. */
    rotate: z.number().min(-360).max(360).optional(),
    /** Cross-axis size: `auto` (hug), `full`/`fill` (parent height), or fixed px. No fractions. */
    height: CommonLayoutHeightSchema.optional(),
    /** Stroke thickness in px for layers that render a stroke primitive (e.g. loader ring). */
    strokeWidth: z.number().int().min(0).max(64).optional(),
  })
  .partial();
export type CommonStyle = z.infer<typeof CommonStyleSchema>;

export const TextStyleSchema = CommonStyleSchema.extend({
  /**
   * Logical font family: manifest `theme.fontFamily` when omitted, {@link TEXT_FONT_FAMILY_SYSTEM_UI}
   * for the platform stack, or a custom name (matches `Branding.fontFamilies[].name` for uploaded fonts).
   */
  fontFamily: z.string().min(1).max(128).optional(),
  fontSize: z.number().int().min(8).max(96).optional(),
  fontWeight: z.number().int().min(100).max(900).optional(),
  color: ThemedColorSchema.optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  lineHeight: z.number().min(0.8).max(3).optional(),
  /** Multiplier (0–1) applied to the resolved background color alpha only; text stays fully opaque unless `opacity` is set. */
  backgroundOpacity: z.number().min(0).max(1).optional(),
});
export type TextStyle = z.infer<typeof TextStyleSchema>;

export const ImageStyleSchema = CommonStyleSchema.extend({
  fit: z.enum(['cover', 'contain', 'fill']).optional(),
  aspectRatio: z.number().positive().max(10).optional(),
});
export type ImageStyle = z.infer<typeof ImageStyleSchema>;

/** Icon style: glyph fits the box (`min(width, height)`); use `style.width`/`style.height` to size. */
export const IconStyleSchema = CommonStyleSchema.extend({
  color: ThemedColorSchema.optional(),
});
export type IconStyle = z.infer<typeof IconStyleSchema>;

export const ICON_FAMILIES = ['ionicons'] as const;
export type IconFamily = (typeof ICON_FAMILIES)[number];

export const ButtonStyleSchema = CommonStyleSchema.extend({
  fontSize: z.number().int().min(8).max(96).optional(),
  fontWeight: z.number().int().min(100).max(900).optional(),
  color: ThemedColorSchema.optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
});
export type ButtonStyle = z.infer<typeof ButtonStyleSchema>;

/** Preset chrome shared by {@link ButtonLayer}, {@link BackButtonLayer}, OAuth custom rows, and email/password submit. */
export const BUTTON_LAYER_VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
export type ButtonLayerVariant = (typeof BUTTON_LAYER_VARIANTS)[number];
export const ButtonLayerVariantSchema = z.enum(BUTTON_LAYER_VARIANTS);

/** Sparse overrides merged mobile-first on top of layer `style`. */
export const CommonStyleBreakpointsSchema = z
  .object({
    sm: CommonStyleSchema.partial().optional(),
    md: CommonStyleSchema.partial().optional(),
    lg: CommonStyleSchema.partial().optional(),
    xl: CommonStyleSchema.partial().optional(),
    '2xl': CommonStyleSchema.partial().optional(),
  })
  .partial()
  .optional();
export type CommonStyleBreakpoints = z.infer<typeof CommonStyleBreakpointsSchema>;

export const TextStyleBreakpointsSchema = z
  .object({
    sm: TextStyleSchema.partial().optional(),
    md: TextStyleSchema.partial().optional(),
    lg: TextStyleSchema.partial().optional(),
    xl: TextStyleSchema.partial().optional(),
    '2xl': TextStyleSchema.partial().optional(),
  })
  .partial()
  .optional();
export type TextStyleBreakpoints = z.infer<typeof TextStyleBreakpointsSchema>;

export const ImageStyleBreakpointsSchema = z
  .object({
    sm: ImageStyleSchema.partial().optional(),
    md: ImageStyleSchema.partial().optional(),
    lg: ImageStyleSchema.partial().optional(),
    xl: ImageStyleSchema.partial().optional(),
    '2xl': ImageStyleSchema.partial().optional(),
  })
  .partial()
  .optional();
export type ImageStyleBreakpoints = z.infer<typeof ImageStyleBreakpointsSchema>;

export const IconStyleBreakpointsSchema = z
  .object({
    sm: IconStyleSchema.partial().optional(),
    md: IconStyleSchema.partial().optional(),
    lg: IconStyleSchema.partial().optional(),
    xl: IconStyleSchema.partial().optional(),
    '2xl': IconStyleSchema.partial().optional(),
  })
  .partial()
  .optional();
export type IconStyleBreakpoints = z.infer<typeof IconStyleBreakpointsSchema>;

export const ButtonStyleBreakpointsSchema = z
  .object({
    sm: ButtonStyleSchema.partial().optional(),
    md: ButtonStyleSchema.partial().optional(),
    lg: ButtonStyleSchema.partial().optional(),
    xl: ButtonStyleSchema.partial().optional(),
    '2xl': ButtonStyleSchema.partial().optional(),
  })
  .partial()
  .optional();
export type ButtonStyleBreakpoints = z.infer<typeof ButtonStyleBreakpointsSchema>;

const StackLayoutBreakpointPatchSchema = z
  .object({
    gap: NonNegativePxSchema.optional(),
    direction: z.enum(['vertical', 'horizontal']).optional(),
  })
  .partial();

export const StackLayoutBreakpointsSchema = z
  .object({
    sm: StackLayoutBreakpointPatchSchema.optional(),
    md: StackLayoutBreakpointPatchSchema.optional(),
    lg: StackLayoutBreakpointPatchSchema.optional(),
    xl: StackLayoutBreakpointPatchSchema.optional(),
    '2xl': StackLayoutBreakpointPatchSchema.optional(),
  })
  .partial()
  .optional();
export type StackLayoutBreakpoints = z.infer<typeof StackLayoutBreakpointsSchema>;

const ButtonLayoutBreakpointPatchSchema = z
  .object({
    gap: NonNegativePxSchema.optional(),
    direction: z.enum(['vertical', 'horizontal']).optional(),
  })
  .partial();

export const ButtonLayoutBreakpointsSchema = z
  .object({
    sm: ButtonLayoutBreakpointPatchSchema.optional(),
    md: ButtonLayoutBreakpointPatchSchema.optional(),
    lg: ButtonLayoutBreakpointPatchSchema.optional(),
    xl: ButtonLayoutBreakpointPatchSchema.optional(),
    '2xl': ButtonLayoutBreakpointPatchSchema.optional(),
  })
  .partial()
  .optional();
export type ButtonLayoutBreakpoints = z.infer<typeof ButtonLayoutBreakpointsSchema>;
