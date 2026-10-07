import { z } from 'zod';
import { IanaTimeZoneSchema } from './timezone';

/** Attribute keys stored on customer columns, not in the attributes JSON object. */
export const PROFILE_COLUMN_BY_ATTRIBUTE_KEY = {
  first_name: 'firstName',
  last_name: 'lastName',
  phone: 'phone',
  locale: 'locale',
  country: 'country',
  timezone: 'timezone',
} as const;

export const PROFILE_COLUMNS = [
  'firstName',
  'lastName',
  'phone',
  'locale',
  'country',
  'timezone',
] as const;

export type ProfileColumn = (typeof PROFILE_COLUMNS)[number];

export type CustomerProfilePatch = Partial<{
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  locale: string | null;
  country: string | null;
  timezone: string | null;
}>;

const ATTRIBUTE_KEY_BY_COLUMN: Record<ProfileColumn, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  phone: 'phone',
  locale: 'locale',
  country: 'country',
  timezone: 'timezone',
};

export const ProfileNameSchema = z.string().trim().max(80);
export const ProfilePhoneSchema = z.string().trim().max(32);
export const ProfileLocaleSchema = z.string().trim().max(35);
export const ProfileCountrySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, 'country must be a two-letter code')
  .transform((value) => value.toUpperCase());

const PROFILE_VALUE_SCHEMAS = {
  firstName: ProfileNameSchema,
  lastName: ProfileNameSchema,
  phone: ProfilePhoneSchema,
  locale: ProfileLocaleSchema,
  country: ProfileCountrySchema,
  timezone: IanaTimeZoneSchema,
} as const;

/**
 * Blank clears the column (`null`). JSON `null` and a missing field stay unset.
 * Swift identify encodes omitted optionals as JSON null, which must not clear.
 */
export const optionalClearable = <Output>(schema: z.ZodType<Output, z.ZodTypeDef, string>) =>
  z.preprocess(
    (value: unknown) => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'string' && value.trim() === '') return '';
      return value;
    },
    z.union([z.literal('').transform(() => null), schema]).optional(),
  );

/** Blank, null, and omitted stay unset. Used by CSV import, which must not wipe stored values. */
export const optionalProfileValue = <Output>(schema: z.ZodType<Output, z.ZodTypeDef, string>) =>
  z.preprocess((value: unknown) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return value;
  }, schema.optional());

export const asAttributeRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

/** Lift a reserved attribute onto its column. Invalid values stay in JSON (`undefined`). */
export const parseProfileAttributeValue = (
  column: ProfileColumn,
  value: unknown,
): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  if (value.trim() === '') return null;
  const parsed = PROFILE_VALUE_SCHEMAS[column].safeParse(value);
  if (!parsed.success) return undefined;
  return parsed.data;
};

/**
 * Top-level profile fields win over the same keys inside `attributes`.
 * Lifted keys are removed from the attributes object so they are not stored twice.
 */
export const resolveProfileWrite = (
  input: CustomerProfilePatch & { attributes?: Record<string, unknown> },
): { profile: CustomerProfilePatch; attributes?: Record<string, unknown> } => {
  const profile: CustomerProfilePatch = {};
  const rest: Record<string, unknown> = {};
  if (input.attributes) {
    for (const [key, value] of Object.entries(input.attributes)) {
      const column =
        PROFILE_COLUMN_BY_ATTRIBUTE_KEY[key as keyof typeof PROFILE_COLUMN_BY_ATTRIBUTE_KEY];
      if (!column) {
        rest[key] = value;
        continue;
      }
      const parsed = parseProfileAttributeValue(column, value);
      if (parsed === undefined) {
        rest[key] = value;
        continue;
      }
      profile[column] = parsed;
    }
  }
  for (const column of PROFILE_COLUMNS) {
    if (input[column] !== undefined) profile[column] = input[column];
  }
  return {
    profile,
    attributes: input.attributes === undefined ? undefined : rest,
  };
};

export const profilePatchIsEmpty = (profile: CustomerProfilePatch): boolean =>
  PROFILE_COLUMNS.every((column) => profile[column] === undefined);

/** Shallow-merge attributes, then drop reserved keys for columns written in this request. */
export const mergeStoredAttributes = (
  existing: Record<string, unknown>,
  incoming: Record<string, unknown> | undefined,
  profile: CustomerProfilePatch,
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...existing };
  if (incoming) {
    for (const [key, value] of Object.entries(incoming)) {
      merged[key] = value;
    }
  }
  for (const column of PROFILE_COLUMNS) {
    if (profile[column] === undefined) continue;
    delete merged[ATTRIBUTE_KEY_BY_COLUMN[column]];
  }
  return merged;
};
