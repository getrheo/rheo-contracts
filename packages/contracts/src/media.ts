import { z } from 'zod';
import { MEDIA_TYPES } from './constants/index';

export const MediaTypeSchema = z.enum(MEDIA_TYPES);

export const MediaReferenceSchema = z.object({
  mediaAssetId: z.string().uuid(),
});

export type MediaReference = z.infer<typeof MediaReferenceSchema>;

export const MediaAssetSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  type: MediaTypeSchema,
  url: z.string().url(),
  name: z.string().nullable().optional(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  archivedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export {
  mergeMediaFileNameStem,
  mediaExtensionFromContentType,
  splitMediaFileName,
} from './mediaFileName.js';
