import { z } from 'zod';
import { LocalizedTextSchema } from '../../localized.js';
import type {
  CommonStyle,
  CommonStyleBreakpoints,
  TextStyle,
  TextStyleBreakpoints,
} from '../styleCommon.js';
import type { RestingMotion, RestingMotionEntry } from '../restingMotion.js';
import type { LayerRaw } from './union.js';
import type { TextInputFieldStyle } from './input.js';

export const DATE_TIME_INPUT_MODES = ['date', 'time', 'datetime'] as const;
export type DateTimeInputMode = (typeof DATE_TIME_INPUT_MODES)[number];

/** Typography / chrome for typed or selected values in form-pattern inputs. */
export type FormPatternFieldStyle = TextInputFieldStyle;

export const NUMBER_STEPPER_BUTTON_ROLES = ['decrement', 'increment'] as const;
export type NumberStepperButtonRole = (typeof NUMBER_STEPPER_BUTTON_ROLES)[number];

export type DateTimeInputLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'date_time_input';
  fieldKey: string;
  /** Defaults to `date` when omitted. */
  mode?: DateTimeInputMode;
  /** When false, empty value is valid. Defaults to true. */
  required?: boolean;
  /** Inclusive lower bound (ISO date / time / datetime matching `mode`). */
  min?: string;
  /** Inclusive upper bound (ISO date / time / datetime matching `mode`). */
  max?: string;
  defaultValue?: string;
  placeholder?: z.infer<typeof LocalizedTextSchema>;
  classification: 'safe' | 'sensitive';
  children?: LayerRaw[];
  fieldStyle?: FormPatternFieldStyle;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};

/**
 * +/- control inside a {@link NumberStepperLayerRaw}. Style the button chrome here;
 * optional `children` hold the glyph (text/icon), same spirit as button content.
 */
export type NumberStepperButtonLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'number_stepper_button';
  role: NumberStepperButtonRole;
  children?: LayerRaw[];
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};

/**
 * Live numeric value (and optional unit) inside a {@link NumberStepperLayerRaw}.
 * Uses {@link TextStyle} so typography matches other text layers in the builder.
 */
export type NumberStepperValueLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'number_stepper_value';
  unitLabel?: z.infer<typeof LocalizedTextSchema>;
  style?: TextStyle;
  styleBreakpoints?: TextStyleBreakpoints;
};

/**
 * Quantity stepper as a stacked compound: enclosing stack layout
 * (`direction` / `gap` / `align` / `distribution` / `style`) with structural children
 * {@link NumberStepperButtonLayerRaw} and {@link NumberStepperValueLayerRaw}
 * so each part can be selected and styled.
 */
export type NumberStepperLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'number_stepper';
  fieldKey: string;
  min: number;
  max: number;
  /** Step between valid values; defaults to 1 in runtime when omitted. */
  step?: number;
  defaultValue?: number;
  classification: 'safe' | 'sensitive';
  /** Main axis; defaults to `horizontal` in renderers when omitted. */
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  distribution?: 'start' | 'center' | 'end' | 'between' | 'around';
  children: Array<NumberStepperButtonLayerRaw | NumberStepperValueLayerRaw>;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};

export type PhoneInputLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'phone_input';
  fieldKey: string;
  /** ISO 3166-1 alpha-2 default country (e.g. `US`). Defaults to `US`. */
  defaultCountryCode?: string;
  /** When set, only these countries appear in the picker. */
  allowedCountryCodes?: string[];
  required?: boolean;
  placeholder?: z.infer<typeof LocalizedTextSchema>;
  classification: 'safe' | 'sensitive';
  children?: LayerRaw[];
  fieldStyle?: FormPatternFieldStyle;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};

export const ADDRESS_INPUT_FIELDS = [
  'line1',
  'line2',
  'city',
  'region',
  'postalCode',
  'country',
] as const;
export type AddressInputField = (typeof ADDRESS_INPUT_FIELDS)[number];

export type AddressValue = {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
};

export type AddressInputPlaceholders = Partial<
  Record<AddressInputField, z.infer<typeof LocalizedTextSchema>>
>;

export type AddressInputLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'address_input';
  fieldKey: string;
  /**
   * Fields that must be non-empty to submit. Defaults to
   * `line1`, `city`, `postalCode`, `country` when omitted.
   */
  requiredFields?: AddressInputField[];
  /** When false, the line2 row is hidden. Defaults to true. */
  showLine2?: boolean;
  /** When false, the region/state row is hidden. Defaults to true. */
  showRegion?: boolean;
  defaultCountryCode?: string;
  placeholders?: AddressInputPlaceholders;
  classification: 'safe' | 'sensitive';
  children?: LayerRaw[];
  fieldStyle?: FormPatternFieldStyle;
  gap?: number;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};
