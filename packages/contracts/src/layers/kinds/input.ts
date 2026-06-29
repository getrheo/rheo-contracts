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
} from '../styleCommon.js';
import { ThemedColorSchema } from '../themedColor.js';
import { ChoiceOptionBindingSchema, ChoiceBranchingSchema } from '../choiceBranching.js';
import {
  TextInputTypeSchema,
} from '../actions.js';
import type { StackLayerRaw } from '../layerRawTypes.js';

import type { ChoiceOptionBinding } from '../choiceBranching.js';
import { StackLayerSchema } from './layout.js';

/**
 * Choice layers serialise their option content as `children` (one stack
 * per option) plus `optionBindings` that map a stable `optionId` (used
 * by branching, analytics, and stored responses) to the `rootLayerId`
 * of the matching child stack. Bindings are validated to reference
 * direct children only.
 */
const ChoiceChildrenAndBindingsRefinement = (
  data: { children: unknown[]; optionBindings: ChoiceOptionBinding[] },
  ctx: z.RefinementCtx,
): void => {
  const childIds = new Set<string>();
  for (const c of data.children as { id: string }[]) {
    if (childIds.has(c.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate option child id "${c.id}"`,
        path: ['children'],
      });
    }
    childIds.add(c.id);
  }
  const seenOptionIds = new Set<string>();
  const seenRootIds = new Set<string>();
  for (const b of data.optionBindings) {
    if (seenOptionIds.has(b.optionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate optionId "${b.optionId}" in optionBindings`,
        path: ['optionBindings'],
      });
    }
    seenOptionIds.add(b.optionId);
    if (seenRootIds.has(b.rootLayerId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate rootLayerId "${b.rootLayerId}" in optionBindings`,
        path: ['optionBindings'],
      });
    }
    seenRootIds.add(b.rootLayerId);
    if (!childIds.has(b.rootLayerId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `optionBindings rootLayerId "${b.rootLayerId}" does not match any direct child stack`,
        path: ['optionBindings'],
      });
    }
  }
  if (data.optionBindings.length !== (data.children as unknown[]).length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'optionBindings length must equal children length',
      path: ['optionBindings'],
    });
  }
};

export const SingleChoiceLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('single_choice'),
  fieldKey: FieldKeySchema,
  children: z.lazy(() =>
    z.array(StackLayerSchema).min(2),
  ) as unknown as z.ZodType<StackLayerRaw[]>,
  optionBindings: z.array(ChoiceOptionBindingSchema).min(2),
  branching: ChoiceBranchingSchema,
  direction: z.enum(['vertical', 'horizontal', 'grid']).optional(),
  gap: z.number().int().min(0).optional(),
  columns: z.number().int().min(1).max(12).optional(),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});

export const MultipleChoiceLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('multiple_choice'),
  fieldKey: FieldKeySchema,
  children: z.lazy(() =>
    z.array(StackLayerSchema).min(2),
  ) as unknown as z.ZodType<StackLayerRaw[]>,
  optionBindings: z.array(ChoiceOptionBindingSchema).min(2),
  minSelections: z.number().int().nonnegative().optional(),
  maxSelections: z.number().int().positive().optional(),
  branching: ChoiceBranchingSchema,
  direction: z.enum(['vertical', 'horizontal', 'grid']).optional(),
  gap: z.number().int().min(0).optional(),
  columns: z.number().int().min(1).max(12).optional(),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
});

/**
 * Validates the consistency between a choice layer's `children` and
 * `optionBindings`. Exposed for the manifest-level walker to apply
 * after the per-layer schemas (which can't `.superRefine` because
 * `discriminatedUnion` requires plain ZodObject members).
 */
export const validateChoiceChildrenAndBindings = ChoiceChildrenAndBindingsRefinement;

export const TextInputLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('text_input'),
  fieldKey: FieldKeySchema,
  placeholder: LocalizedTextSchema.optional(),
  inputType: TextInputTypeSchema.optional(),
  required: z.boolean().optional(),
  minLength: z.number().int().min(0).max(2000).optional(),
  maxLength: z.number().int().positive().max(2000).optional(),
  classification: FieldClassificationSchema,
  children: z
    .lazy(() => z.array(lazyLayer()))
    .optional() as unknown as z.ZodType<LayerRaw[] | undefined>,
  style: CommonStyleSchema.optional(),
});

export const ScaleInputLabelStyleSchema = z
  .object({
    fontFamily: z.string().min(1).max(128).optional(),
    fontSize: z.number().int().min(8).max(96).optional(),
    fontWeight: z.number().int().min(100).max(900).optional(),
    color: ThemedColorSchema.optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    lineHeight: z.number().min(0.8).max(3).optional(),
    opacity: z.number().min(0).max(1).optional(),
  })
  .partial();

export const ScaleInputLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('scale_input'),
  fieldKey: FieldKeySchema,
  min: z.number(),
  max: z.number(),
  step: z.number().positive().optional(),
  defaultValue: z.number().optional(),
  minLabel: LocalizedTextSchema.optional(),
  maxLabel: LocalizedTextSchema.optional(),
  labelStyle: ScaleInputLabelStyleSchema.optional(),
  valueStyle: ScaleInputLabelStyleSchema.optional(),
  showLabels: z.boolean().optional(),
  showValue: z.boolean().optional(),
  trackHeight: z.number().int().min(2).max(32).optional(),
  trackColor: ThemedColorSchema.optional(),
  fillColor: ThemedColorSchema.optional(),
  thumbSize: z.number().int().min(8).max(48).optional(),
  thumbColor: ThemedColorSchema.optional(),
  children: z
    .lazy(() => z.array(lazyLayer()))
    .optional() as unknown as z.ZodType<LayerRaw[] | undefined>,
  style: CommonStyleSchema.optional(),
});
