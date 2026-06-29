import { z } from 'zod';

export const ThemeSchema = z.object({
  primary: z.string().optional(),
  primaryForeground: z.string().optional(),
  background: z.string().optional(),
  foreground: z.string().optional(),
  accent: z.string().optional(),
  borderRadius: z.number().optional(),
  fontFamily: z.string().optional(),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const BuilderMetaSchema = z
  .object({
    layout: z
      .object({
        nodes: z
          .array(
            z.object({
              id: z.string(),
              kind: z.enum(['screen', 'decision']).optional(),
              x: z.number(),
              y: z.number(),
            }),
          )
          .optional(),
        canvas: z
          .object({
            zoom: z.number().optional(),
            x: z.number().optional(),
            y: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough()
  .optional();

export type BuilderMeta = z.infer<typeof BuilderMetaSchema>;
