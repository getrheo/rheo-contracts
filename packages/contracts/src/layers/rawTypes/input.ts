import { z } from 'zod';
import { LocalizedTextSchema } from '../../localized.js';
import type {
  CheckboxGlyphStyle,
} from '../oauthConstants.js';
import type {
  CommonStyle,
  CommonStyleBreakpoints,
  ThemedColor,
} from '../styleCommon.js';
import type { TextInputType } from '../actions.js';
import type { RestingMotion, RestingMotionEntry } from '../restingMotion.js';
import type { ChoiceOptionBinding, ChoiceBranching } from '../choiceBranching.js';
import type { LayerRaw } from './union.js';

import type { StackLayerRaw } from './layout.js';

export type SingleChoiceLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'single_choice';
  fieldKey: string;
  /**
   * One stack per option, in order. Each stack composes the option's
   * visual content (text, icons, images, nested layers) AND owns its
   * own `style` / `selectedStyle`. The whole stack is the press target
   * for selection.
   */
  children: StackLayerRaw[];
  /** Maps stable optionId → rootLayerId of the option's child stack. */
  optionBindings: ChoiceOptionBinding[];
  branching: ChoiceBranching;
  /** Layout of the option list (default `vertical`). */
  direction?: 'vertical' | 'horizontal' | 'grid';
  /** Gap between option stacks in px (default 8). */
  gap?: number;
  /**
   * Number of columns when `direction === 'grid'`. Ignored otherwise.
   * Defaults to 2 if omitted in grid mode.
   */
  columns?: number;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};
export type MultipleChoiceLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'multiple_choice';
  fieldKey: string;
  /**
   * One stack per option, in order. Each stack composes the option's
   * visual content AND owns its own `style` / `selectedStyle`. The
   * whole stack is the press target for toggling.
   */
  children: StackLayerRaw[];
  /** Maps stable optionId → rootLayerId of the option's child stack. */
  optionBindings: ChoiceOptionBinding[];
  minSelections?: number;
  maxSelections?: number;
  branching: ChoiceBranching;
  /** Layout of the option list (default `vertical`). */
  direction?: 'vertical' | 'horizontal' | 'grid';
  /** Gap between option stacks in px (default 8). */
  gap?: number;
  /**
   * Number of columns when `direction === 'grid'`. Ignored otherwise.
   * Defaults to 2 if omitted in grid mode.
   */
  columns?: number;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};
export type TextInputLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'text_input';
  fieldKey: string;
  placeholder?: z.infer<typeof LocalizedTextSchema>;
  /** Defaults to `plain` when omitted (backward compatible). */
  inputType?: TextInputType;
  /** When false, empty trimmed text is valid. Defaults to true when omitted. */
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  classification: 'safe' | 'sensitive';
  /**
   * Optional decoration layers (labels, hints, icons) rendered above
   * the native input field. The native field itself is rendered last.
   */
  children?: LayerRaw[];
  style?: CommonStyle;
};
/** Typography for min/max end labels on a scale input slider. */
export type ScaleInputLabelStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: ThemedColor;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  opacity?: number;
};

export type ScaleInputLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'scale_input';
  fieldKey: string;
  min: number;
  max: number;
  /** Step between valid values; defaults to 1 in runtime when omitted. */
  step?: number;
  /** Initial thumb position when the screen loads. */
  defaultValue?: number;
  minLabel?: z.infer<typeof LocalizedTextSchema>;
  maxLabel?: z.infer<typeof LocalizedTextSchema>;
  /** Typography for the min/max end labels. */
  labelStyle?: ScaleInputLabelStyle;
  /** Typography for the selected value below the slider. */
  valueStyle?: ScaleInputLabelStyle;
  /** When false, min/max labels are hidden. Defaults to true. */
  showLabels?: boolean;
  /** When false, the selected value is hidden. Defaults to true. */
  showValue?: boolean;
  /** Slider track height in px (default 4). */
  trackHeight?: number;
  /** Unfilled portion of the slider track. */
  trackColor?: ThemedColor;
  /** Filled portion of the slider track (left of thumb). */
  fillColor?: ThemedColor;
  /** Thumb diameter in px (default 16). */
  thumbSize?: number;
  /** Thumb fill color. */
  thumbColor?: ThemedColor;
  /**
   * Optional decoration layers rendered above the slider. The slider
   * track and labels themselves are rendered by the layer.
   */
  children?: LayerRaw[];
  style?: CommonStyle;
};

export type CheckboxLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'checkbox';
  fieldKey: string;
  /** When true, every Continue button on the screen stays disabled until this box is checked. */
  blocking?: boolean;
  /** Appearance when unchecked. Checked state merges these with {@link CheckboxLayer.checkedStyle}. */
  uncheckedStyle?: CheckboxGlyphStyle;
  /** Overrides / additions when checked (merged on top of unchecked + defaults). */
  checkedStyle?: CheckboxGlyphStyle;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};
