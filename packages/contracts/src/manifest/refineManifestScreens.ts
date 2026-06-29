import { z } from 'zod';
import { walkScreenLayers, walkScreenLayersWithLayoutContext } from '../screens.js';
import type { Screen } from '../screens.js';
import {
  isInputLayer,
  layerHasAbsolutePositionAuthored,
  OS_PERMISSION_OUTCOME_CONTINUE,
  OS_PERMISSION_OUTCOME_END,
  validateChoiceChildrenAndBindings,
  permissionCaptureFieldKey,
} from '../layers.js';
import type { Layer } from '../layers.js';
import type { FlowManifestObjectBase } from './flowManifestObjectBaseSchema.js';

export const refineManifestScreens = (
  manifest: FlowManifestObjectBase,
  ctx: z.RefinementCtx,
  jumpTargets: Set<string>,
  screenIds: Set<string>,
  allFieldKeys: Map<string, string>,
): void => {
  const layerIds = new Set<string>();
  manifest.screens.forEach((screen, screenIdx) => {
    let inputCount = 0;
    const layerIdsForScreen = new Set<string>();
    walkScreenLayers(screen as unknown as Screen, (l: Layer) => {
      layerIdsForScreen.add(l.id);
    });
    walkScreenLayers(screen as unknown as Screen, (l: Layer) => {
      if (layerIds.has(l.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate layer id "${l.id}"`,
          path: ['screens', screenIdx, 'regions'],
        });
      }
      layerIds.add(l.id);
      if (isInputLayer(l)) {
        inputCount += 1;
        if (allFieldKeys.has(l.fieldKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `duplicate fieldKey "${l.fieldKey}" across screens or on the same screen`,
            path: ['screens', screenIdx],
          });
        }
        allFieldKeys.set(l.fieldKey, screen.id);
      }
      if (l.kind === 'checkbox') {
        if (allFieldKeys.has(l.fieldKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `duplicate fieldKey "${l.fieldKey}" across screens or on the same screen`,
            path: ['screens', screenIdx],
          });
        }
        allFieldKeys.set(l.fieldKey, screen.id);
      }
      if (l.kind === 'button' && l.action.kind === 'request_os_permission') {
        const fk = permissionCaptureFieldKey(l.action.permissionKey);
        if (!allFieldKeys.has(fk)) allFieldKeys.set(fk, screen.id);
      }
    });
    if (inputCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `screen "${screen.id}" has ${inputCount} input layers (max 1 allowed)`,
        path: ['screens', screenIdx, 'regions'],
      });
    }

    walkScreenLayersWithLayoutContext(screen as unknown as Screen, (l, layoutCtx) => {
      if (!layerHasAbsolutePositionAuthored(l)) return;
      if (layoutCtx.isRegionRoot) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `layer "${l.id}" cannot use absolute positioning on a screen region root`,
          path: ['screens', screenIdx, 'regions'],
        });
      }
      if (layoutCtx.insideChoiceOption) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `layer "${l.id}" cannot use absolute positioning inside a choice option`,
          path: ['screens', screenIdx, 'regions'],
        });
      }
    });

    walkScreenLayersWithLayoutContext(screen as unknown as Screen, (l, layoutCtx) => {
      if (l.kind === 'oauth_provider' && layoutCtx.parentKind !== 'oauth_login') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `OAuth button "${l.id}" must be nested under an OAuth login layer`,
          path: ['screens', screenIdx, 'regions'],
        });
      }
      if (
        (l.kind === 'email_password_field' || l.kind === 'email_password_submit') &&
        layoutCtx.parentKind !== 'email_password_auth'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Layer "${l.id}" (${l.kind}) must be nested under an Email / password login layer`,
          path: ['screens', screenIdx, 'regions'],
        });
      }
    });

    const nextDefault = screen.next.default;
    if (nextDefault && !jumpTargets.has(nextDefault)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `screen "${screen.id}" next.default "${nextDefault}" not found`,
        path: ['screens', screenIdx, 'next', 'default'],
      });
    }
    walkScreenLayers(screen as unknown as Screen, (l: Layer) => {
      if (l.kind === 'single_choice' || l.kind === 'multiple_choice') {
        validateChoiceChildrenAndBindings(
          { children: l.children, optionBindings: l.optionBindings },
          ctx,
        );
        if (l.branching.enabled) {
          const knownOptionIds = new Set(l.optionBindings.map((b) => b.optionId));
          for (const cond of l.branching.conditions) {
            if (!screenIds.has(cond.goTo)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `screen "${screen.id}" branch condition "${cond.choiceId}" -> "${cond.goTo}" not found`,
                path: ['screens', screenIdx],
              });
            }
            if (!knownOptionIds.has(cond.choiceId)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `screen "${screen.id}" branch condition references unknown choice "${cond.choiceId}"`,
                path: ['screens', screenIdx],
              });
            }
          }
        }
      }
      if (l.kind === 'button' && l.action.kind === 'go_to_step') {
        if (!screenIds.has(l.action.screenId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `screen "${screen.id}" button action go_to_step "${l.action.screenId}" not found`,
            path: ['screens', screenIdx],
          });
        }
      }
      if (
        l.kind === 'button' &&
        l.action.kind === 'go_back_one_screen' &&
        manifest.entryScreenId != null &&
        screen.id === manifest.entryScreenId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `screen "${screen.id}" is the flow entry screen; buttons cannot use go_back_one_screen`,
          path: ['screens', screenIdx],
        });
      }
      if (l.kind === 'button' && l.action.kind === 'request_os_permission') {
        for (const [label, sid] of [
          ['granted', l.action.outcomes.granted],
          ['denied', l.action.outcomes.denied],
          ['blocked', l.action.outcomes.blocked],
        ] as const) {
          if (sid === OS_PERMISSION_OUTCOME_END) {
            // Terminal: no jump target to validate.
          } else if (sid === OS_PERMISSION_OUTCOME_CONTINUE) {
            const def = screen.next.default;
            if (def != null && !jumpTargets.has(def)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `screen "${screen.id}" request_os_permission outcomes.${label} uses default next (continue) but screen.next.default "${def}" is not a valid target`,
                path: ['screens', screenIdx],
              });
            }
          } else if (!jumpTargets.has(sid)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `screen "${screen.id}" request_os_permission outcomes.${label} "${sid}" not found`,
              path: ['screens', screenIdx],
            });
          }
        }
      }
      if (l.kind === 'back_button' && l.fallbackScreenId && !screenIds.has(l.fallbackScreenId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `screen "${screen.id}" back_button fallback "${l.fallbackScreenId}" not found`,
          path: ['screens', screenIdx],
        });
      }
      if (
        l.kind === 'button' &&
        l.action.kind === 'go_back_one_screen' &&
        l.action.fallbackScreenId &&
        !screenIds.has(l.action.fallbackScreenId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `screen "${screen.id}" button go_back_one_screen fallback "${l.action.fallbackScreenId}" not found`,
          path: ['screens', screenIdx],
        });
      }
      if (l.kind === 'text_input') {
        const minL = l.minLength;
        const maxL = l.maxLength;
        if (minL !== undefined && maxL !== undefined && minL > maxL) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `text_input "${l.id}" minLength cannot exceed maxLength`,
            path: ['screens', screenIdx],
          });
        }
      }
      if (l.kind === 'scale_input') {
        if (l.min >= l.max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `scale_input "${l.id}" max must be greater than min`,
            path: ['screens', screenIdx],
          });
        }
        const step = l.step ?? 1;
        if (l.defaultValue !== undefined) {
          if (l.defaultValue < l.min || l.defaultValue > l.max) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `scale_input "${l.id}" defaultValue must be between min and max`,
              path: ['screens', screenIdx],
            });
          } else {
            const rem = (l.defaultValue - l.min) / step;
            if (Math.abs(rem - Math.round(rem)) > 1e-6) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `scale_input "${l.id}" defaultValue must align with min and step`,
                path: ['screens', screenIdx],
              });
            }
          }
        }
      }
    });

    if (screen.animations) {
      const clipIds = new Set<string>();
      for (const clip of screen.animations) {
        if (clipIds.has(clip.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `screen "${screen.id}" has duplicate clip id "${clip.id}"`,
            path: ['screens', screenIdx, 'animations'],
          });
        }
        clipIds.add(clip.id);
        if (!layerIdsForScreen.has(clip.targetLayerId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `clip "${clip.id}" targets layer "${clip.targetLayerId}" not on screen "${screen.id}"`,
            path: ['screens', screenIdx, 'animations'],
          });
        }
      }
    }
  });
};
