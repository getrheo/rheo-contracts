import { z } from 'zod';

export const LocaleCode = z
  .string()
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'locale must be like "en" or "en-US"');

export const LocalizedTextSchema = z.object({
  default: z.string().min(1, 'default copy is required'),
  translations: z.record(LocaleCode, z.string()).optional(),
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export const resolveLocalizedText = (text: LocalizedText, locale: string): string => {
  if (text.translations && text.translations[locale]) {
    return text.translations[locale]!;
  }
  return text.default;
};
