import type { CommonStyle } from './styleCommon.js';
import type { LayerRaw } from './layerRawTypes.js';

const STYLE_BREAKPOINT_KEYS = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

/** True if base style or any breakpoint patch sets `position: 'absolute'`. */
export const commonStyleHasAbsolutePosition = (
  style: CommonStyle | undefined,
  breakpoints:
    | Partial<Record<(typeof STYLE_BREAKPOINT_KEYS)[number], Partial<CommonStyle>>>
    | undefined,
): boolean => {
  if (style?.position === 'absolute') return true;
  if (!breakpoints) return false;
  for (const k of STYLE_BREAKPOINT_KEYS) {
    if (breakpoints[k]?.position === 'absolute') return true;
  }
  return false;
};

/** True when this layer's authored style / breakpoints / selectedStyle allow absolute positioning. */
export const layerHasAbsolutePositionAuthored = (layer: LayerRaw): boolean => {
  switch (layer.kind) {
    case 'stack':
      return (
        commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints) ||
        layer.selectedStyle?.position === 'absolute'
      );
    case 'text':
    case 'counter':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'image':
    case 'lottie':
    case 'video':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'icon':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'button':
    case 'back_button':
    case 'hyperlink':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'progress':
    case 'loader':
      return commonStyleHasAbsolutePosition(layer.style, undefined);
    case 'text_input':
    case 'scale_input':
      return commonStyleHasAbsolutePosition(layer.style, undefined);
    case 'oauth_provider':
      if (layer.variant === 'preset') {
        return commonStyleHasAbsolutePosition(layer.style as CommonStyle | undefined, layer.styleBreakpoints);
      }
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'oauth_login':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'email_password_auth':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'email_password_field':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'email_password_submit':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    case 'carousel':
      return commonStyleHasAbsolutePosition(layer.style, undefined);
    case 'checkbox':
    case 'single_choice':
    case 'multiple_choice':
      return commonStyleHasAbsolutePosition(layer.style, layer.styleBreakpoints);
    default:
      return false;
  }
};

/** True if this layer or any descendant authors absolute positioning. */
export const layerSubtreeContainsAbsolutePosition = (layer: LayerRaw): boolean => {
  if (layerHasAbsolutePositionAuthored(layer)) return true;
  if (layer.kind === 'stack') {
    return layer.children.some(layerSubtreeContainsAbsolutePosition);
  }
  if (layer.kind === 'carousel') {
    return layer.slides.some(layerSubtreeContainsAbsolutePosition);
  }
  if (layer.kind === 'button' || layer.kind === 'back_button' || layer.kind === 'hyperlink') {
    return layer.children.some(layerSubtreeContainsAbsolutePosition);
  }
  if (layer.kind === 'single_choice' || layer.kind === 'multiple_choice') {
    return layer.children.some(layerSubtreeContainsAbsolutePosition);
  }
  if (layer.kind === 'text_input' || layer.kind === 'scale_input') {
    return layer.children?.some(layerSubtreeContainsAbsolutePosition) ?? false;
  }
  if (layer.kind === 'oauth_login') {
    return layer.children.some(layerSubtreeContainsAbsolutePosition);
  }
  if (layer.kind === 'oauth_provider' && layer.variant === 'custom') {
    return layer.children.some(layerSubtreeContainsAbsolutePosition);
  }
  if (layer.kind === 'email_password_auth') {
    return layer.children.some(layerSubtreeContainsAbsolutePosition);
  }
  if (layer.kind === 'email_password_field') {
    return layer.children?.some(layerSubtreeContainsAbsolutePosition) ?? false;
  }
  if (layer.kind === 'email_password_submit') {
    return layer.children.some(layerSubtreeContainsAbsolutePosition);
  }
  return false;
};
