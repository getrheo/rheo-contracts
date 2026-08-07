import { z } from 'zod';
import { LocalizedTextSchema } from '../../localized.js';
import { FieldKeySchema, FieldClassificationSchema } from '../../fields.js';
import { baseLayerShape } from '../base.js';
import { layerSchemaStore } from '../layerSchemaRef.js';
const lazyLayer = () => layerSchemaStore.schema!;
import type { LayerRaw } from '../layerRawTypes.js';
import {
  CommonStyleSchema,
  CommonStyleBreakpointsSchema,
  TextStyleSchema,
  TextStyleBreakpointsSchema,
} from '../styleCommon.js';
import { TextInputFieldStyleSchema } from './input.js';
import {
  ADDRESS_INPUT_FIELDS,
  DATE_TIME_INPUT_MODES,
  NUMBER_STEPPER_BUTTON_ROLES,
  type NumberStepperButtonRole,
} from '../rawTypes/formPatterns.js';

/** ISO 3166-1 alpha-2 country code. */
export const CountryCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Za-z]{2}$/u)
  .transform((s) => s.toUpperCase());

export const DateTimeInputModeSchema = z.enum(DATE_TIME_INPUT_MODES);

export const DateTimeInputLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('date_time_input'),
  fieldKey: FieldKeySchema,
  mode: DateTimeInputModeSchema.optional(),
  required: z.boolean().optional(),
  min: z.string().min(1).max(64).optional(),
  max: z.string().min(1).max(64).optional(),
  defaultValue: z.string().min(1).max(64).optional(),
  placeholder: LocalizedTextSchema.optional(),
  classification: FieldClassificationSchema,
  children: z
    .lazy(() => z.array(lazyLayer()))
    .optional() as unknown as z.ZodType<LayerRaw[] | undefined>,
  fieldStyle: TextInputFieldStyleSchema.optional(),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});

export const NumberStepperButtonRoleSchema = z.enum(NUMBER_STEPPER_BUTTON_ROLES);

export const NumberStepperButtonLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('number_stepper_button'),
  role: NumberStepperButtonRoleSchema,
  children: z
    .lazy(() => z.array(lazyLayer()))
    .optional() as unknown as z.ZodType<LayerRaw[] | undefined>,
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});

export const NumberStepperValueLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('number_stepper_value'),
  unitLabel: LocalizedTextSchema.optional(),
  style: TextStyleSchema.optional(),
  styleBreakpoints: TextStyleBreakpointsSchema,
});

/** Legacy flat steppers: inflate structural children from valueStyle / buttonColor / unitLabel. */
const migrateNumberStepperIncoming = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if (o.kind !== 'number_stepper') return raw;
  if (Array.isArray(o.children) && o.children.length > 0) return raw;

  const idBase = typeof o.id === 'string' ? o.id : 'lyr_number_stepper';
  const slugRaw = idBase.replace(/^lyr_/i, '').replace(/[^a-z0-9_]/gi, '_');
  const slug = slugRaw.length > 0 ? slugRaw.slice(0, 40) : 'stepper';

  const valueStyle =
    o.valueStyle && typeof o.valueStyle === 'object'
      ? (o.valueStyle as Record<string, unknown>)
      : undefined;
  const buttonColor = o.buttonColor;

  const mkButton = (role: NumberStepperButtonRole, glyph: string) => {
    const suf = role === 'decrement' ? 'dec' : 'inc';
    return {
      id: (`lyr_${slug}_btn_${suf}`).slice(0, 64),
      kind: 'number_stepper_button',
      role,
      style: {
        width: 36,
        height: 36,
        radius: 8,
      },
      children: [
        {
          id: (`lyr_${slug}_btn_${suf}_txt`).slice(0, 64),
          kind: 'text',
          text: { default: glyph },
          style: {
            fontSize: 20,
            align: 'center',
            ...(buttonColor !== undefined ? { color: buttonColor } : {}),
          },
        },
      ],
    };
  };

  const valueChild: Record<string, unknown> = {
    id: (`lyr_${slug}_value`).slice(0, 64),
    kind: 'number_stepper_value',
    style: {
      fontSize: typeof valueStyle?.fontSize === 'number' ? valueStyle.fontSize : 14,
      width: 'full',
      ...(typeof valueStyle?.fontFamily === 'string'
        ? { fontFamily: valueStyle.fontFamily }
        : {}),
      ...(typeof valueStyle?.fontWeight === 'number'
        ? { fontWeight: valueStyle.fontWeight }
        : {}),
      ...(valueStyle?.color !== undefined ? { color: valueStyle.color } : {}),
      ...(typeof valueStyle?.lineHeight === 'number'
        ? { lineHeight: valueStyle.lineHeight }
        : {}),
      ...(typeof valueStyle?.letterSpacing === 'number'
        ? { letterSpacing: valueStyle.letterSpacing }
        : {}),
      ...(typeof valueStyle?.opacity === 'number' ? { opacity: valueStyle.opacity } : {}),
      align: typeof valueStyle?.align === 'string' ? valueStyle.align : 'center',
    },
  };
  if (o.unitLabel !== undefined) valueChild.unitLabel = o.unitLabel;

  const {
    valueStyle: _vs,
    buttonColor: _bc,
    unitLabel: _ul,
    ...rest
  } = o;

  return {
    ...rest,
    direction: typeof o.direction === 'string' ? o.direction : 'horizontal',
    gap: typeof o.gap === 'number' ? o.gap : 12,
    align: typeof o.align === 'string' ? o.align : 'center',
    ...(typeof o.distribution === 'string' ? { distribution: o.distribution } : {}),
    children: [mkButton('decrement', '-'), valueChild, mkButton('increment', '+')],
  };
};

const refineNumberStepperChildren = (
  data: { children: LayerRaw[] },
  ctx: z.RefinementCtx,
): void => {
  const buttons = data.children.filter((c) => c.kind === 'number_stepper_button');
  const values = data.children.filter((c) => c.kind === 'number_stepper_value');
  const other = data.children.filter(
    (c) => c.kind !== 'number_stepper_button' && c.kind !== 'number_stepper_value',
  );

  if (other.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'number_stepper children must be number_stepper_button or number_stepper_value',
      path: ['children'],
    });
  }

  const roles = new Set<string>();
  for (const b of buttons) {
    if (b.kind !== 'number_stepper_button') continue;
    if (roles.has(b.role)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate number_stepper_button role "${b.role}"`,
        path: ['children'],
      });
    }
    roles.add(b.role);
  }
  for (const role of NUMBER_STEPPER_BUTTON_ROLES) {
    if (!roles.has(role)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `number_stepper requires a number_stepper_button with role "${role}"`,
        path: ['children'],
      });
    }
  }
  if (values.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `number_stepper must have exactly one number_stepper_value (found ${values.length})`,
      path: ['children'],
    });
  }
};

const NumberStepperLayerSchemaValidated = z
  .object({
    ...baseLayerShape,
    kind: z.literal('number_stepper'),
    fieldKey: FieldKeySchema,
    min: z.number(),
    max: z.number(),
    step: z.number().positive().optional(),
    defaultValue: z.number().optional(),
    classification: FieldClassificationSchema,
    direction: z.enum(['vertical', 'horizontal']).optional(),
    gap: z.number().int().min(0).max(64).optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    distribution: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
    children: z.lazy(() =>
      z
        .array(z.union([NumberStepperButtonLayerSchema, NumberStepperValueLayerSchema]))
        .min(1),
    ),
    style: CommonStyleSchema.optional(),
    styleBreakpoints: CommonStyleBreakpointsSchema,
  })
  .superRefine(refineNumberStepperChildren);

export const NumberStepperLayerSchema = z.preprocess(
  migrateNumberStepperIncoming,
  NumberStepperLayerSchemaValidated,
);

export const PhoneInputLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('phone_input'),
  fieldKey: FieldKeySchema,
  defaultCountryCode: CountryCodeSchema.optional(),
  allowedCountryCodes: z.array(CountryCodeSchema).min(1).max(250).optional(),
  required: z.boolean().optional(),
  placeholder: LocalizedTextSchema.optional(),
  classification: FieldClassificationSchema,
  children: z
    .lazy(() => z.array(lazyLayer()))
    .optional() as unknown as z.ZodType<LayerRaw[] | undefined>,
  fieldStyle: TextInputFieldStyleSchema.optional(),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});

export const AddressInputFieldSchema = z.enum(ADDRESS_INPUT_FIELDS);

export const AddressInputPlaceholdersSchema = z
  .object({
    line1: LocalizedTextSchema.optional(),
    line2: LocalizedTextSchema.optional(),
    city: LocalizedTextSchema.optional(),
    region: LocalizedTextSchema.optional(),
    postalCode: LocalizedTextSchema.optional(),
    country: LocalizedTextSchema.optional(),
  })
  .partial();

export const AddressInputLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('address_input'),
  fieldKey: FieldKeySchema,
  requiredFields: z.array(AddressInputFieldSchema).min(1).max(6).optional(),
  showLine2: z.boolean().optional(),
  showRegion: z.boolean().optional(),
  defaultCountryCode: CountryCodeSchema.optional(),
  placeholders: AddressInputPlaceholdersSchema.optional(),
  classification: FieldClassificationSchema,
  children: z
    .lazy(() => z.array(lazyLayer()))
    .optional() as unknown as z.ZodType<LayerRaw[] | undefined>,
  fieldStyle: TextInputFieldStyleSchema.optional(),
  gap: z.number().int().min(0).max(64).optional(),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});
