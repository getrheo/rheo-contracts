import { z } from 'zod';

export const ThemedColorModesSchema = z
  .object({
    light: z.string().min(1).optional(),
    dark: z.string().min(1).optional(),
  })
  .strict()
  .refine((o) => o.light !== undefined || o.dark !== undefined, {
    message: 'at least one of light or dark is required',
  });

export const ThemedColorSchema = z.union([z.string().min(1), ThemedColorModesSchema]);
export type ThemedColor = z.infer<typeof ThemedColorSchema>;

/** Default body text: near-black on light surfaces, near-white on dark (matches sim/native chrome). */
export const DEFAULT_THEMED_FOREGROUND: ThemedColor = {
  light: '#000000',
  dark: '#ffffff',
};

/** Label on filled primary (and similar) buttons — high contrast on saturated fills in both modes. */
export const PRIMARY_FILLED_LABEL: ThemedColor = {
  light: '#ffffff',
  dark: '#000000',
};
