import { z } from 'zod';
import { LocalizedTextSchema } from '../../localized.js';
import { parseHyperlinkHref } from '../../hyperlinkHref.js';
import { MediaReferenceSchema } from '../../media.js';
import { baseLayerShape } from '../base.js';
import { layerSchemaStore } from '../layerSchemaRef.js';
const lazyLayer = () => layerSchemaStore.schema!;
import type { LayerRaw } from '../layerRawTypes.js';
import {
  CommonStyleSchema,
  CommonStyleBreakpointsSchema,
  TextStyleSchema,
  TextStyleBreakpointsSchema,
  ImageStyleSchema,
  ImageStyleBreakpointsSchema,
  IconStyleSchema,
  IconStyleBreakpointsSchema,
  StackLayoutBreakpointsSchema,
  ICON_FAMILIES,
} from '../styleCommon.js';
import { LoaderOnCompleteSchema } from './chrome.js';



export const StackLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('stack'),
  style: CommonStyleSchema.optional(),
  styleBreakpoints: CommonStyleBreakpointsSchema,
  stackLayoutBreakpoints: StackLayoutBreakpointsSchema,
  selectedStyle: CommonStyleSchema.optional(),
  direction: z.enum(['vertical', 'horizontal']),
  gap: z.number().int().min(0).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justify: z.enum(['start', 'center', 'end']).optional(),
  distribution: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
  wrap: z.boolean().optional(),
  children: z.lazy(() => z.array(lazyLayer())) as unknown as z.ZodType<LayerRaw[]>,
});

export const TextLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('text'),
  text: LocalizedTextSchema,
  style: TextStyleSchema.optional(),
  styleBreakpoints: TextStyleBreakpointsSchema,
});

const migrateLegacyHyperlinkForParse = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if (o.kind !== 'hyperlink') return raw;
  const existing = o.children;
  if (Array.isArray(existing) && existing.length > 0) return raw;

  const idSrc = typeof o.id === 'string' ? o.id.replace(/[^a-zA-Z0-9_]/g, '_') : 'lyr_hyperlink';
  const textChildId = `${idSrc}_lnktxt`.slice(0, 64);
  const children: Record<string, unknown>[] = [
    {
      id: textChildId,
      kind: 'text',
      text: o.text ?? { default: 'Link' },
      ...(typeof o.style === 'object' && o.style !== null ? { style: o.style } : {}),
      ...(typeof o.styleBreakpoints === 'object' && o.styleBreakpoints !== null
        ? { styleBreakpoints: o.styleBreakpoints }
        : {}),
    },
  ];
  const next: Record<string, unknown> = {
    ...o,
    children,
  };
  delete next.text;
  delete next.style;
  delete next.styleBreakpoints;
  return next;
};

const HyperlinkLayerSchemaInner = z
  .object({
    ...baseLayerShape,
    kind: z.literal('hyperlink'),
    href: z.string().min(1).max(2048),
    children: z.lazy(() => z.array(lazyLayer()).min(1)) as unknown as z.ZodType<LayerRaw[]>,
    direction: z.enum(['vertical', 'horizontal']).optional(),
    gap: z.number().int().min(0).optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    distribution: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
    wrap: z.boolean().optional(),
    style: CommonStyleSchema.optional(),
    styleBreakpoints: CommonStyleBreakpointsSchema,
  })
  .superRefine((data, ctx) => {
    const p = parseHyperlinkHref(data.href.trim());
    if (!p.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'hyperlink href must be a valid https: or mailto: URL',
        path: ['href'],
      });
    }
  });

export const HyperlinkLayerSchema = z.preprocess(
  migrateLegacyHyperlinkForParse,
  HyperlinkLayerSchemaInner,
);

export const ImageLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('image'),
  media: MediaReferenceSchema.optional(),
  alt: z.string().max(280).optional(),
  style: ImageStyleSchema.optional(),
  styleBreakpoints: ImageStyleBreakpointsSchema,
});

export const LottieLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('lottie'),
  media: MediaReferenceSchema.optional(),
  loop: z.boolean().optional(),
  autoPlay: z.boolean().optional(),
  triggerLayerId: z.string().min(1).optional(),
  onComplete: LoaderOnCompleteSchema.optional(),
  style: ImageStyleSchema.optional(),
  styleBreakpoints: ImageStyleBreakpointsSchema,
});

export const VideoLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('video'),
  media: MediaReferenceSchema.optional(),
  loop: z.boolean().optional(),
  autoPlay: z.boolean().optional(),
  triggerLayerId: z.string().min(1).optional(),
  onComplete: LoaderOnCompleteSchema.optional(),
  audioEnabled: z.boolean().optional(),
  style: ImageStyleSchema.optional(),
  styleBreakpoints: ImageStyleBreakpointsSchema,
});

export const IconLayerSchema = z.object({
  ...baseLayerShape,
  kind: z.literal('icon'),
  family: z.enum(ICON_FAMILIES),
  iconName: z.string().min(1).max(128),
  style: IconStyleSchema.optional(),
  styleBreakpoints: IconStyleBreakpointsSchema,
});
