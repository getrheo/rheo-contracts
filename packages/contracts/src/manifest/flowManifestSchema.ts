import { z } from 'zod';
import { FlowManifestObjectBaseSchema } from './flowManifestObjectBaseSchema.js';
import { refineFlowManifest } from './refineFlowManifest.js';

export const FlowManifestObjectSchema = FlowManifestObjectBaseSchema.superRefine(refineFlowManifest);

/**
 * Public schema. Re-exports the validated object schema directly; legacy
 * shapes (e.g. pre-2026 button `label` → `children`) are migrated by
 * `migrateLegacyManifest` which callers can wrap around any input
 * before parsing. We avoid `z.preprocess` here because it widens the
 * inferred input type to `unknown` and breaks downstream `z.infer`
 * consumers (FlowDraftSchema, sdk.ts, etc.).
 */
export const FlowManifestSchema = FlowManifestObjectSchema;

export type FlowManifest = z.output<typeof FlowManifestObjectSchema>;
