import { z } from 'zod';
import { LayerIdSchema } from './ids.js';
import { RestingMotionSchema, RestingMotionEntrySchema } from './restingMotion.js';

export const baseLayerShape = {
  id: LayerIdSchema,
  name: z.string().max(80).optional(),
  restingMotion: RestingMotionSchema.optional(),
  restingMotions: z.array(RestingMotionEntrySchema).optional(),
} as const;
