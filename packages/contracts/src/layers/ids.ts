import { z } from 'zod';

export const LayerIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^lyr_[a-z0-9_]+$/i, 'layer id must look like lyr_<id>');

export const ScreenIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^scr_[a-z0-9_]+$/i, 'screen id must look like scr_<id>');

export type LayerId = z.infer<typeof LayerIdSchema>;
export type ScreenId = z.infer<typeof ScreenIdSchema>;
