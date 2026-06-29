import { z } from 'zod';
import { baseLayerShape } from '../base.js';
import {
  CommonStyleSchema,
  CommonStyleBreakpointsSchema,
} from '../styleCommon.js';


import type { StackLayerRaw } from '../layerRawTypes.js';

import { PaddingSchema, BorderSchema, DropShadowSchema } from '../styleCommon.js';
import { ThemedColorSchema } from '../themedColor.js';
import { StackLayerSchema } from './layout.js';

export const CarouselIndicatorsStyleSchema = z
  .object({
    width: z.number().int().min(1).max(64).optional(),
    height: z.number().int().min(1).max(64).optional(),
    defaultColor: ThemedColorSchema.optional(),
    defaultOpacity: z.number().min(0).max(1).optional(),
    activeColor: ThemedColorSchema.optional(),
    activeOpacity: z.number().min(0).max(1).optional(),
    activeWidth: z.number().int().min(1).max(64).optional(),
    activeHeight: z.number().int().min(1).max(64).optional(),
    border: BorderSchema.optional(),
    activeBorder: BorderSchema.optional(),
  })
  .partial();

export const CarouselPageControlSchema = z.object({
  position: z.enum(['top', 'bottom']),
  spacing: z.number().int().min(0).optional(),
  padding: PaddingSchema.optional(),
  margin: PaddingSchema.optional(),
  indicators: CarouselIndicatorsStyleSchema.optional(),
  border: BorderSchema.optional(),
  shadow: DropShadowSchema.optional(),
});

export const CarouselLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('carousel'),
  slides: z.lazy(() => z.array(StackLayerSchema).min(1)) as unknown as z.ZodType<StackLayerRaw[]>,
  pageAlignment: z.enum(['top', 'center', 'bottom']).optional(),
  pageSpacing: z.number().int().min(0).optional(),
  pagePeek: z.number().int().min(0).max(400).optional(),
  openOn: z.number().int().min(0).optional(),
  loop: z.boolean().optional(),
  autoAdvance: z.boolean().optional(),
  autoAdvanceMs: z.number().int().min(500).max(60000).optional(),
  pageControl: CarouselPageControlSchema.optional(),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});
