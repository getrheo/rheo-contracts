import { z } from 'zod';
import { ScreenIdSchema } from '../ids.js';
import { baseLayerShape } from '../base.js';
import { layerSchemaStore } from '../layerSchemaRef.js';
const lazyLayer = () => layerSchemaStore.schema!;
import type { LayerRaw } from '../layerRawTypes.js';
import {
  CommonStyleSchema,
  CommonStyleBreakpointsSchema,
  TextStyleSchema,
  TextStyleBreakpointsSchema,
  ButtonStyleSchema,
  ButtonStyleBreakpointsSchema,
  ButtonLayoutBreakpointsSchema,
  ButtonLayerVariantSchema,
} from '../styleCommon.js';
import {
  ButtonActionSchema,
} from '../actions.js';

import { ThemedColorSchema } from '../themedColor.js';
import {
  COUNTER_DISPLAY_KINDS,
  COUNTER_TIME_FORMATS,
} from '../actions.js';
import { CheckboxGlyphStyleSchema } from '../oauthConstants.js';

export const ButtonLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('button'),
  children: z.lazy(() => z.array(lazyLayer())) as unknown as z.ZodType<LayerRaw[]>,
  action: ButtonActionSchema,
  variant: ButtonLayerVariantSchema,
  direction: z.enum(['vertical', 'horizontal']).optional(),
  gap: z.number().int().min(0).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  distribution: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
  style: ButtonStyleSchema.optional(),
  styleBreakpoints: ButtonStyleBreakpointsSchema,
  buttonLayoutBreakpoints: ButtonLayoutBreakpointsSchema,
});

export const BackButtonLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('back_button'),
  children: z.lazy(() => z.array(lazyLayer())) as unknown as z.ZodType<LayerRaw[]>,
  variant: ButtonLayerVariantSchema,
  direction: z.enum(['vertical', 'horizontal']).optional(),
  gap: z.number().int().min(0).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  distribution: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
  style: ButtonStyleSchema.optional(),
  styleBreakpoints: ButtonStyleBreakpointsSchema,
  buttonLayoutBreakpoints: ButtonLayoutBreakpointsSchema,
  fallbackScreenId: ScreenIdSchema.optional(),
});

/**
 * Progress bar layer. All sizing lives on `style`:
 * - `style.width` controls the bar's horizontal extent.
 * - `style.height` controls the bar thickness in px (required by templates).
 */
export const ProgressLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('progress'),
  trackColor: ThemedColorSchema.optional(),
  fillColor: ThemedColorSchema.optional(),
  style: CommonStyleSchema.optional(),
});

export const LoaderOnCompleteSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('none') }),
  z.object({ mode: z.literal('next') }),
  z.object({ mode: z.literal('screen'), screenId: ScreenIdSchema }),
]);

/**
 * Loader. All sizing lives on `style`:
 * - linear: `style.height` is the bar thickness.
 * - circular: `style.width` must equal `style.height` (diameter); `style.strokeWidth` is the ring thickness.
 */
export const LoaderLayerSchema = z
  .object({
    ...baseLayerShape,
    kind: z.literal('loader'),
    variant: z.enum(['linear', 'circular']).optional(),
    targetPercent: z.number().int().min(0).max(100).optional(),
    fillDelayMs: z.number().int().min(0).max(10_000).optional(),
    durationMs: z.number().int().min(0).max(3_600_000).optional(),
    onComplete: LoaderOnCompleteSchema.optional(),
    trackColor: ThemedColorSchema.optional(),
    trackOpacity: z.number().min(0).max(1).optional(),
    fillColor: ThemedColorSchema.optional(),
    /** Horizontal alignment of the bar or ring within the layer box (default start). */
    align: z.enum(['start', 'center', 'end']).optional(),
    style: CommonStyleSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.variant !== 'circular') return;
    const w = data.style?.width;
    const h = data.style?.height;
    if (typeof w === 'number' && typeof h === 'number' && w !== h) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'circular loader requires style.width === style.height',
        path: ['style', 'height'],
      });
    }
  });

export const CounterLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('counter'),
  startValue: z.number().finite(),
  endValue: z.number().finite(),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
  delayMs: z.number().int().min(0).max(3_600_000).optional(),
  decimalPlaces: z.number().int().min(0).max(10).optional(),
  displayKind: z.enum(COUNTER_DISPLAY_KINDS).optional(),
  timeFormat: z.enum(COUNTER_TIME_FORMATS).optional(),
  style: TextStyleSchema.optional(),
  styleBreakpoints: TextStyleBreakpointsSchema,
});

export const CheckboxLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('checkbox'),
  fieldKey: z.string().min(1),
  blocking: z.boolean().optional(),
  uncheckedStyle: CheckboxGlyphStyleSchema.optional(),
  checkedStyle: CheckboxGlyphStyleSchema.optional(),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});
