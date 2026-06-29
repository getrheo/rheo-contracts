import { z } from 'zod';
import {
  ScreenIdSchema,
  StackLayerSchema,
  appReviewCaptureFieldKey,
  isInputLayer,
  permissionCaptureFieldKey,
} from './layers';
import type { Layer, StackLayer } from './layers';
import { PaddingSchema } from './layers/styleCommon.js';
import {
  ScreenBackgroundFillSchema,
  ScreenContainerStyleBreakpointsSchema,
} from './screenBackground.js';
import type { ScreenContainerStyleBreakpoints } from './screenBackground.js';
import { FlowJumpTargetSchema } from './decisions';
import {
  AnimationClipSchema,
  ScreenStaggerSchema,
} from './animations';
import type {
  AnimationClip,
  ScreenStagger,
} from './animations';

export const ScreenNextSchema = z.object({
  default: FlowJumpTargetSchema,
});
export type ScreenNext = z.infer<typeof ScreenNextSchema>;

export const ScreenRegionsSchema = z.object({
  header: StackLayerSchema.optional(),
  body: StackLayerSchema,
  footer: StackLayerSchema.optional(),
});
export type ScreenRegions = {
  header?: StackLayer;
  body: StackLayer;
  footer?: StackLayer;
};

/** Padding, margin, and shell backdrop on the screen container (wraps header/body/footer). */
export const ScreenContainerStyleSchema = z
  .object({
    padding: PaddingSchema.optional(),
    margin: PaddingSchema.optional(),
    /** When true, runtimes add device safe-area insets to shell padding (in addition to manual padding). */
    insetSafeArea: z.boolean().optional(),
    backgroundFill: ScreenBackgroundFillSchema.optional(),
  })
  .partial();
export type ScreenContainerStyle = z.infer<typeof ScreenContainerStyleSchema>;

export {
  ScreenBackgroundFillSchema,
  ScreenBackgroundFillPatchSchema,
  ScreenBackgroundScrimSchema,
  ScreenBackgroundFitSchema,
  ScreenBackgroundColorFillSchema,
  ScreenBackgroundImageFillSchema,
  ScreenBackgroundVideoFillSchema,
  ScreenContainerStyleBreakpointsSchema,
  screenBackgroundPlaybackId,
  isScreenBackgroundPlaybackId,
  SCREEN_BACKGROUND_PLAYBACK_PREFIX,
  defaultScreenBackgroundColorFill,
  defaultScreenBackgroundImageFill,
  defaultScreenBackgroundVideoFill,
} from './screenBackground.js';
export type {
  ScreenBackgroundFill,
  ScreenBackgroundColorFill,
  ScreenBackgroundImageFill,
  ScreenBackgroundVideoFill,
  ScreenBackgroundFillPatch,
  ScreenBackgroundScrim,
  ScreenBackgroundFit,
  ScreenContainerStyleBreakpoints,
} from './screenBackground.js';

export const ScreenSchema = z.object({
  id: ScreenIdSchema,
  name: z.string().min(1).max(80),
  regions: ScreenRegionsSchema,
  next: ScreenNextSchema,
  /** Ordered animation clips bound to layers on this screen. */
  animations: z.array(AnimationClipSchema).optional(),
  /** Defaults for clips with `trigger: stagger`. */
  stagger: ScreenStaggerSchema.optional(),
  /** Chrome on the outer screen container (wraps all regions). */
  containerStyle: ScreenContainerStyleSchema.optional(),
  containerStyleBreakpoints: ScreenContainerStyleBreakpointsSchema,
});

export type Screen = {
  id: string;
  name: string;
  regions: ScreenRegions;
  next: ScreenNext;
  animations?: AnimationClip[];
  stagger?: ScreenStagger;
  containerStyle?: ScreenContainerStyle;
  containerStyleBreakpoints?: ScreenContainerStyleBreakpoints;
};

/** Layout context for validating positioning rules (region roots, choice options). */
export type LayerLayoutWalkCtx = {
  region: 'header' | 'body' | 'footer';
  isRegionRoot: boolean;
  insideChoiceOption: boolean;
  /** Kind of this layer's direct parent wrapper (null only for region-root stacks). */
  parentKind: Layer['kind'] | null;
};

/** Like {@link walkScreenLayers} but passes region-root and choice-option ancestry. */
export const walkScreenLayersWithLayoutContext = (
  screen: Screen,
  fn: (l: Layer, ctx: LayerLayoutWalkCtx) => void,
): void => {
  const visit = (l: Layer, ctx: LayerLayoutWalkCtx): void => {
    fn(l, ctx);
    const childCtx = (
      opts: Partial<Pick<LayerLayoutWalkCtx, 'insideChoiceOption'>> = {},
    ): LayerLayoutWalkCtx => ({
      region: ctx.region,
      isRegionRoot: false,
      insideChoiceOption: opts.insideChoiceOption ?? ctx.insideChoiceOption,
      parentKind: l.kind,
    });
    if (l.kind === 'stack') {
      for (const c of l.children) visit(c, childCtx());
    } else if (l.kind === 'carousel') {
      for (const s of l.slides) visit(s, childCtx());
    } else if (l.kind === 'button' || l.kind === 'back_button') {
      for (const c of l.children) visit(c, childCtx());
    } else if (l.kind === 'hyperlink') {
      for (const c of l.children) visit(c, childCtx());
    } else if (l.kind === 'single_choice' || l.kind === 'multiple_choice') {
      for (const c of l.children) {
        visit(c, childCtx({ insideChoiceOption: true }));
      }
    } else if (l.kind === 'text_input' || l.kind === 'scale_input') {
      for (const c of l.children ?? []) visit(c, childCtx());
    } else if (l.kind === 'oauth_login') {
      for (const c of l.children) visit(c, childCtx());
    } else if (l.kind === 'oauth_provider' && l.variant === 'custom') {
      for (const c of l.children) visit(c, childCtx());
    } else if (l.kind === 'email_password_auth') {
      for (const c of l.children) visit(c, childCtx());
    } else if (l.kind === 'email_password_field') {
      for (const c of l.children ?? []) visit(c, childCtx());
    } else if (l.kind === 'email_password_submit') {
      for (const c of l.children) visit(c, childCtx());
    }
  };
  const regionCtx = (region: 'header' | 'body' | 'footer'): LayerLayoutWalkCtx => ({
    region,
    isRegionRoot: true,
    insideChoiceOption: false,
    parentKind: null,
  });
  if (screen.regions.header) visit(screen.regions.header, regionCtx('header'));
  visit(screen.regions.body, regionCtx('body'));
  if (screen.regions.footer) visit(screen.regions.footer, regionCtx('footer'));
};

/** Walk every layer in a screen's regions (header, body, footer). */
export const walkScreenLayers = (screen: Screen, fn: (l: Layer) => void): void => {
  const visit = (l: Layer): void => {
    fn(l);
    if (l.kind === 'stack') l.children.forEach(visit);
    else if (l.kind === 'carousel') l.slides.forEach(visit);
    else if (l.kind === 'button') l.children.forEach(visit);
    else if (l.kind === 'back_button') l.children.forEach(visit);
    else if (l.kind === 'hyperlink') l.children.forEach(visit);
    else if (l.kind === 'single_choice' || l.kind === 'multiple_choice') {
      l.children.forEach(visit);
    } else if (l.kind === 'text_input' || l.kind === 'scale_input') {
      l.children?.forEach(visit);
    } else if (l.kind === 'oauth_login') {
      l.children.forEach(visit);
    } else if (l.kind === 'oauth_provider' && l.variant === 'custom') {
      l.children.forEach(visit);
    } else if (l.kind === 'email_password_auth') {
      l.children.forEach(visit);
    } else if (l.kind === 'email_password_field') {
      l.children?.forEach(visit);
    } else if (l.kind === 'email_password_submit') {
      l.children.forEach(visit);
    }
  };
  if (screen.regions.header) visit(screen.regions.header);
  visit(screen.regions.body);
  if (screen.regions.footer) visit(screen.regions.footer);
};

/**
 * Field keys for user-capture layers on a screen: primary input (choice / text / scale),
 * standalone checkboxes, and synthetic keys for OS permission buttons.
 * Aligns with manifest validation (unique field keys, permission capture keys).
 */
export const collectAnswerCaptureFieldKeysFromScreen = (screen: Screen): string[] => {
  const keys: string[] = [];
  walkScreenLayers(screen, (l) => {
    if (isInputLayer(l)) keys.push(l.fieldKey);
    if (l.kind === 'checkbox') keys.push(l.fieldKey);
    if (l.kind === 'button' && l.action.kind === 'request_os_permission') {
      keys.push(permissionCaptureFieldKey(l.action.permissionKey));
    }
    if (l.kind === 'button' && l.action.kind === 'request_app_review') {
      keys.push(appReviewCaptureFieldKey(l.id));
    }
  });
  return keys;
};
