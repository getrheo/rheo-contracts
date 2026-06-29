import { z } from 'zod';
import { LocalizedTextSchema } from '../../localized.js';
import { MediaReferenceSchema } from '../../media.js';


import type {
  CommonStyle,
  CommonStyleBreakpoints,
  StackLayoutBreakpoints,
  TextStyle,
  TextStyleBreakpoints,
  ImageStyle,
  ImageStyleBreakpoints,
  IconStyle,
  IconStyleBreakpoints,
  IconFamily,
} from '../styleCommon.js';
import type { RestingMotion, RestingMotionEntry } from '../restingMotion.js';
import type { LoaderOnCompleteRaw } from './chrome.js';
import type { LayerRaw } from './union.js';


export type StackLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'stack';
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
  stackLayoutBreakpoints?: StackLayoutBreakpoints;
  /**
   * Style merged on top of `style` when this stack is the bound option
   * root of a `single_choice` / `multiple_choice` layer and that option
   * is currently selected. Ignored for stacks that are not option
   * roots.
   */
  selectedStyle?: CommonStyle;
  direction: 'vertical' | 'horizontal';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end';
  distribution?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  children: LayerRaw[];
};
export type TextLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'text';
  text: z.infer<typeof LocalizedTextSchema>;
  style?: TextStyle;
  styleBreakpoints?: TextStyleBreakpoints;
};
export type ImageLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'image';
  media?: z.infer<typeof MediaReferenceSchema>;
  alt?: string;
  style?: ImageStyle;
  styleBreakpoints?: ImageStyleBreakpoints;
};
/** Lottie JSON referenced by MediaAsset on the org CDN (same pipeline as images). */
export type LottieLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'lottie';
  media?: z.infer<typeof MediaReferenceSchema>;
  /** When false, animation plays once. Defaults to true at runtime when omitted. */
  loop?: boolean;
  /** When true (default), plays on screen mount. When false, requires {@link triggerLayerId}. */
  autoPlay?: boolean;
  /** Button layer id that starts playback when {@link autoPlay} is false. */
  triggerLayerId?: string;
  /** Navigation when play-once completes (ignored when looping). */
  onComplete?: LoaderOnCompleteRaw;
  style?: ImageStyle;
  styleBreakpoints?: ImageStyleBreakpoints;
};
/** Video file referenced by MediaAsset on the org CDN (same pipeline as images / Lottie). */
export type VideoLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'video';
  media?: z.infer<typeof MediaReferenceSchema>;
  /** When false, video plays once. Defaults to true at runtime when omitted. */
  loop?: boolean;
  /** When true (default), plays on screen mount. When false, requires {@link triggerLayerId}. */
  autoPlay?: boolean;
  /** Button layer id that starts playback when {@link autoPlay} is false. */
  triggerLayerId?: string;
  /** Navigation when play-once completes (ignored when looping). */
  onComplete?: LoaderOnCompleteRaw;
  /** When true, video audio is enabled (may be blocked on autoplay by the platform). */
  audioEnabled?: boolean;
  style?: ImageStyle;
  styleBreakpoints?: ImageStyleBreakpoints;
};
export type IconLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'icon';
  /** Which icon set to resolve at runtime (Lucide or Ionicons). */
  family: IconFamily;
  /**
   * Icon identifier within the family: Lucide kebab-case (`circle-help`),
   * Ionicons glyph name (`star-outline`).
   */
  iconName: string;
  style?: IconStyle;
  styleBreakpoints?: IconStyleBreakpoints;
};
/** Tappable region that opens a URL in the system browser (https / mailto only). Layout + hit target wrap `children`. */
export type HyperlinkLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'hyperlink';
  href: string;
  /** Content inside the link (text, icons, stacks, etc.). */
  children: LayerRaw[];
  /** Container layout — mirrors a subset of {@link StackLayer} / {@link ButtonLayer} fields. */
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  distribution?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};
