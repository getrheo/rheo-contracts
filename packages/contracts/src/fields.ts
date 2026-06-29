import { z } from 'zod';
import { FIELD_CLASSIFICATIONS } from './constants/index';

export const FIELD_KEY_RE = /^[a-z][a-z0-9_]*$/;

export const FieldKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(FIELD_KEY_RE, 'field key must be snake_case');

export type FieldKey = z.infer<typeof FieldKeySchema>;

export const FieldClassificationSchema = z.enum(FIELD_CLASSIFICATIONS);
