import { z } from 'zod';
import { LocaleCode } from '../localized.js';
import { ScreenSchema } from '../screens.js';
import { DecisionNodeSchema } from '../decisions.js';
import { ExternalSurfaceNodeSchema } from '../externalSurfaces.js';
import { MANIFEST_SCHEMA_VERSION } from './version.js';
import { BuilderMetaSchema, ThemeSchema } from './theme.js';

/** Flow manifest object schema without cross-field superRefine (attached in flowManifestSchema.ts). */
export const FlowManifestObjectBaseSchema = z.object({
  flowId: z.string().uuid(),
  /** Manifest schema version — see {@link MANIFEST_SCHEMA_VERSION}. */
  schemaVersion: z.literal(MANIFEST_SCHEMA_VERSION).optional(),
  version: z.number().int().positive(),
  defaultLocale: LocaleCode,
  locales: z.array(LocaleCode),
  /** When null, the draft has no wired entry target (builder connects the canvas entry node). */
  entryScreenId: z.union([z.string().min(1), z.null()]),
  screens: z.array(ScreenSchema),
  decisionNodes: z
    .union([z.array(DecisionNodeSchema), z.undefined()])
    .transform((x) => x ?? []),
  externalSurfaceNodes: z
    .union([z.array(ExternalSurfaceNodeSchema), z.undefined()])
    .transform((x) => x ?? []),
  sdkAttributeKeys: z
    .union([z.array(z.string().min(1).max(128)), z.undefined()])
    .transform((x) => x ?? []),
  theme: ThemeSchema.optional(),
  builderMeta: BuilderMetaSchema,
});

export type FlowManifestObjectBase = z.infer<typeof FlowManifestObjectBaseSchema>;
