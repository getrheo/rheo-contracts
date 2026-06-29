import type {
  CommonStyle,
  CommonStyleBreakpoints,
  Padding,
  Border,
  DropShadow,
  ThemedColor,
} from '../styleCommon.js';
import type { RestingMotion, RestingMotionEntry } from '../restingMotion.js';
import type { StackLayerRaw } from './layout.js';

/**
 * Per-state styling for the carousel page-control dots. `default` covers
 * inactive dots; `active` overrides for the dot of the current page.
 * Width/height in `active` fall back to the default when omitted.
 */
export type CarouselIndicatorsStyle = {
  width?: number;
  height?: number;
  defaultColor?: ThemedColor;
  defaultOpacity?: number;
  activeColor?: ThemedColor;
  activeOpacity?: number;
  activeWidth?: number;
  activeHeight?: number;
  /** Optional ring around each dot (inactive state). */
  border?: Border;
  /** Optional ring when the dot is active. */
  activeBorder?: Border;
};

/**
 * Visual & layout configuration for the dot row beneath/above the
 * carousel slides. When the whole `pageControl` field is undefined the
 * controls are hidden.
 */
export type CarouselPageControl = {
  position: 'top' | 'bottom';
  spacing?: number;
  padding?: Padding;
  margin?: Padding;
  indicators?: CarouselIndicatorsStyle;
  border?: Border;
  shadow?: DropShadow;
};

export type CarouselLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'carousel';
  slides: StackLayerRaw[];
  /** Cross-axis alignment applied to each slide within the carousel viewport. */
  pageAlignment?: 'top' | 'center' | 'bottom';
  /** Gap between slides (px). */
  pageSpacing?: number;
  /** Visible peek of the neighbouring slide (px). */
  pagePeek?: number;
  /** Initial slide index when the carousel mounts. */
  openOn?: number;
  loop?: boolean;
  /** When true the carousel auto-advances using `autoAdvanceMs` (default 4s). */
  autoAdvance?: boolean;
  autoAdvanceMs?: number;
  pageControl?: CarouselPageControl;
  style?: CommonStyle;
  styleBreakpoints?: CommonStyleBreakpoints;
};
