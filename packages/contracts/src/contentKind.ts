import { z } from 'zod';

/** Letter, then letters, digits, or underscores. Length 1–64. */
export const SLUG_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export const SlugKeySchema = z.string().regex(SLUG_KEY_PATTERN);

export const ContentKindSchema = z.enum(['flow', 'code', 'banner']);
export type ContentKind = z.infer<typeof ContentKindSchema>;

export const CodeParameterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
export type CodeParameterValue = z.infer<typeof CodeParameterValueSchema>;

const MAX_PARAMETER_ENTRIES = 32;
const MAX_PARAMETER_JSON_BYTES = 8192;

export const CodeParametersSchema = z
  .record(SlugKeySchema, CodeParameterValueSchema)
  .superRefine((value, ctx) => {
    const keys = Object.keys(value);
    if (keys.length > MAX_PARAMETER_ENTRIES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `parameters allow at most ${MAX_PARAMETER_ENTRIES} entries`,
      });
    }
    if (JSON.stringify(value).length > MAX_PARAMETER_JSON_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'parameters must serialize under 8KB',
      });
    }
  });
export type CodeParameters = z.infer<typeof CodeParametersSchema>;
