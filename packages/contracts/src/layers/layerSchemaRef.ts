import type { z } from 'zod';
import type { LayerRaw } from './layerRawTypes.js';

/** Populated by initLayerSchema.ts; z.lazy() in kind schemas reads this at parse time. */
export const layerSchemaStore: { schema?: z.ZodType<LayerRaw> } = {};
