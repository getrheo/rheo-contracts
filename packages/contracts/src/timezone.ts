import { z } from 'zod';

/** True when `tz` is a valid IANA zone id (Intl accepts it). */
export const isValidIanaTimeZone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/** IANA timezone id (e.g. `America/New_York`). Rejects offsets-only and junk. */
export const IanaTimeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine(isValidIanaTimeZone, { message: 'timezone must be a valid IANA time zone' });
export type IanaTimeZone = z.infer<typeof IanaTimeZoneSchema>;

/** Civil clock time `HH:mm` (24h). */
export const CivilLocalTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'expected HH:mm');
export type CivilLocalTime = z.infer<typeof CivilLocalTimeSchema>;

/** Civil calendar date `YYYY-MM-DD`. */
export const CivilLocalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
export type CivilLocalDate = z.infer<typeof CivilLocalDateSchema>;
