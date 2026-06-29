import type { ScreenId } from '../ids.js';


import type {
  CommonStyle,
  ButtonLayoutBreakpoints,
  TextStyle,
  TextStyleBreakpoints,
  ButtonStyle,
  ButtonStyleBreakpoints,
  ButtonLayerVariant,
  ThemedColor,
} from '../styleCommon.js';
import type { ButtonAction, CounterDisplayKind, CounterTimeFormat } from '../actions.js';
import type { RestingMotion, RestingMotionEntry } from '../restingMotion.js';
import type { LayerRaw } from './union.js';


export type ButtonLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'button';
  /**
   * The button is a container that lays out its `children` like a stack
   * (typically a single Text label, optionally with leading/trailing
   * icons). Authors compose the visual content the same way they would in
   * a stack and configure tap behaviour via `action`.
   */
  children: LayerRaw[];
  action: ButtonAction;
  variant: ButtonLayerVariant;
  /** Container layout — mirrors a subset of StackLayer fields. */
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  distribution?: 'start' | 'center' | 'end' | 'between' | 'around';
  style?: ButtonStyle;
  styleBreakpoints?: ButtonStyleBreakpoints;
  buttonLayoutBreakpoints?: ButtonLayoutBreakpoints;
};
/** Like {@link ButtonLayerRaw} but always pops the flow history (or uses `fallbackScreenId`). */
export type BackButtonLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'back_button';
  children: LayerRaw[];
  variant: ButtonLayerVariant;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  distribution?: 'start' | 'center' | 'end' | 'between' | 'around';
  style?: ButtonStyle;
  styleBreakpoints?: ButtonStyleBreakpoints;
  buttonLayoutBreakpoints?: ButtonLayoutBreakpoints;
  /**
   * When the user is on the first step (no history), tapping navigates here
   * instead. Optional — if unset and there is nowhere to go back, the
   * control is disabled at runtime.
   */
  fallbackScreenId?: ScreenId;
};
/**
 * Linear progress from the screen’s index in `manifest.screens` (1-based / total).
 *
 * All sizing lives on `style`:
 * - `style.width` controls the bar's horizontal extent.
 * - `style.height` controls the bar thickness in px.
 */
export type ProgressLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'progress';
  trackColor?: ThemedColor;
  fillColor?: ThemedColor;
  style?: CommonStyle;
};
/**
 * Timed determinate loader (linear bar or circular ring); orthogonal to {@link ProgressLayerRaw} flow progress.
 *
 * All sizing lives on `style`:
 * - linear: `style.height` is the bar thickness.
 * - circular: `style.width` must equal `style.height` (diameter); `style.strokeWidth` is the ring thickness.
 */
export type LoaderLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'loader';
  variant?: 'linear' | 'circular';
  /** Fill animates from 0% to this value (default 100). */
  targetPercent?: number;
  /** Milliseconds after mount before the fill begins animating (default 0); max aligns with clip delay authoring. */
  fillDelayMs?: number;
  /** Wall-clock ms to reach {@link LoaderLayerRaw.targetPercent} (default 2000). */
  durationMs?: number;
  /** Optional navigation when the animation completes (default no automatic navigation). */
  onComplete?: LoaderOnCompleteRaw;
  trackColor?: ThemedColor;
  /** Opacity of the track only (0–1); does not affect fill or layer `style.opacity`. */
  trackOpacity?: number;
  fillColor?: ThemedColor;
  /** Horizontal alignment of the bar or ring within the layer box (default start). */
  align?: 'start' | 'center' | 'end';
  style?: CommonStyle;
};
export type LoaderOnCompleteRaw =
  | { mode: 'none' }
  | { mode: 'next' }
  | { mode: 'screen'; screenId: ScreenId };
/** Counts linearly from {@link CounterLayerRaw.startValue} to {@link CounterLayerRaw.endValue} over {@link CounterLayerRaw.durationMs}. */
export type CounterLayerRaw = {
  id: string;
  name?: string;
  restingMotion?: RestingMotion;
  restingMotions?: RestingMotionEntry[];
  kind: 'counter';
  startValue: number;
  endValue: number;
  /** Milliseconds for the linear transition; `0` jumps immediately to `endValue`. */
  durationMs?: number;
  /** Wait this many milliseconds after mount before counting begins (default 0). */
  delayMs?: number;
  /** Fractional digits when rendering (0 = whole numbers). Defaults to 0 when omitted. */
  decimalPlaces?: number;
  /** Number vs clock-style time (start/end are total seconds when `time`). */
  displayKind?: CounterDisplayKind;
  /** Units shown when `displayKind` is `time`. Defaults to `mm_ss` when omitted. */
  timeFormat?: CounterTimeFormat;
  style?: TextStyle;
  styleBreakpoints?: TextStyleBreakpoints;
};
