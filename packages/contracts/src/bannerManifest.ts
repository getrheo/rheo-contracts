import { z } from 'zod';
import { LocaleCode } from './localized.js';
import { ScreenSchema } from './screens.js';
import { MANIFEST_SCHEMA_VERSION } from './manifest/version.js';
import { BuilderMetaSchema, ThemeSchema } from './manifest/theme.js';

const BANNER_DIMENSION_MIN = 8;
const BANNER_DIMENSION_MAX = 4096;

const BannerDimensionSchema = z.number().int().min(BANNER_DIMENSION_MIN).max(BANNER_DIMENSION_MAX);

export const BannerFixedSizingSchema = z
  .object({
    mode: z.literal('fixed'),
    width: BannerDimensionSchema,
    height: BannerDimensionSchema,
  })
  .strict();

const BannerResponsiveSizingBaseSchema = z
  .object({
    mode: z.literal('responsive'),
    maxWidth: BannerDimensionSchema.optional(),
    minHeight: BannerDimensionSchema.optional(),
    maxHeight: BannerDimensionSchema.optional(),
  })
  .strict();

export const BannerResponsiveSizingSchema = BannerResponsiveSizingBaseSchema;

export const BannerSizingSchema = z
  .discriminatedUnion('mode', [BannerFixedSizingSchema, BannerResponsiveSizingBaseSchema])
  .superRefine((value, ctx) => {
    if (value.mode !== 'responsive') return;
    if (
      value.minHeight !== undefined &&
      value.maxHeight !== undefined &&
      value.minHeight > value.maxHeight
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minHeight must be <= maxHeight',
        path: ['minHeight'],
      });
    }
  });
export type BannerSizing = z.infer<typeof BannerSizingSchema>;

export const BannerManifestObjectSchema = z.object({
  bannerId: z.string().uuid(),
  schemaVersion: z.literal(MANIFEST_SCHEMA_VERSION).optional(),
  version: z.number().int().positive(),
  defaultLocale: LocaleCode,
  locales: z.array(LocaleCode),
  rootScreen: ScreenSchema,
  sizing: BannerSizingSchema,
  theme: ThemeSchema.optional(),
  builderMeta: BuilderMetaSchema,
});

export const BannerManifestSchema = BannerManifestObjectSchema;
export type BannerManifest = z.infer<typeof BannerManifestSchema>;
