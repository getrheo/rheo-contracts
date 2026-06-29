import { z } from 'zod';
import {
  EXTERNAL_SURFACE_NO_NEXT,
  collectDecisionSdkKeys,
} from '../decisions.js';
import { isReservedSdkKey } from '../sdkAttributes.js';
import type { FlowManifestObjectBase } from './flowManifestObjectBaseSchema.js';

export const buildManifestJumpTargets = (manifest: FlowManifestObjectBase): Set<string> => {
  const screenIds = new Set(manifest.screens.map((s) => s.id));
  const decisionIds = new Set(manifest.decisionNodes.map((d) => d.id));
  const surfaceIds = new Set(manifest.externalSurfaceNodes.map((s) => s.id));
  return new Set<string>([
    ...screenIds,
    ...decisionIds,
    ...surfaceIds,
    EXTERNAL_SURFACE_NO_NEXT,
  ]);
};

export const refineManifestGraph = (
  manifest: FlowManifestObjectBase,
  ctx: z.RefinementCtx,
  jumpTargets: Set<string>,
): { screenIds: Set<string>; decisionIds: Set<string>; surfaceIds: Set<string> } => {
  const screenIds = new Set<string>();
  for (const s of manifest.screens) {
    if (screenIds.has(s.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate screen id "${s.id}"`,
        path: ['screens'],
      });
    }
    screenIds.add(s.id);
  }
  const decisionIds = new Set(manifest.decisionNodes.map((d) => d.id));
  const surfaceIds = new Set(manifest.externalSurfaceNodes.map((s) => s.id));

  if (manifest.entryScreenId != null && !jumpTargets.has(manifest.entryScreenId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `entryScreenId "${manifest.entryScreenId}" not found in screens, decisionNodes, or externalSurfaceNodes`,
      path: ['entryScreenId'],
    });
  }
  const seenDecisionId = new Set<string>();
  const sdkAllow = new Set(manifest.sdkAttributeKeys);
  manifest.decisionNodes.forEach((dn, di) => {
    if (seenDecisionId.has(dn.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate decision node id "${dn.id}"`,
        path: ['decisionNodes', di],
      });
    }
    seenDecisionId.add(dn.id);
    if (screenIds.has(dn.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `decision node id "${dn.id}" collides with a screen id`,
        path: ['decisionNodes', di],
      });
    }
    if (surfaceIds.has(dn.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `decision node id "${dn.id}" collides with an external surface id`,
        path: ['decisionNodes', di],
      });
    }
    dn.cases.forEach((c, ci) => {
      if (c.next != null && !jumpTargets.has(c.next)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `decision "${dn.id}" case "${c.id}" next "${c.next}" not found`,
          path: ['decisionNodes', di, 'cases', ci, 'next'],
        });
      }
      for (const sk of collectDecisionSdkKeys(c.expression)) {
        if (isReservedSdkKey(sk)) continue;
        if (!sdkAllow.has(sk)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `decision "${dn.id}" case "${c.id}" references sdk key "${sk}" not in sdkAttributeKeys`,
            path: ['decisionNodes', di, 'cases', ci, 'expression'],
          });
        }
      }
    });
    if (dn.elseNext != null && !jumpTargets.has(dn.elseNext)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `decision "${dn.id}" elseNext "${dn.elseNext}" not found`,
        path: ['decisionNodes', di, 'elseNext'],
      });
    }
  });

  const seenSurfaceId = new Set<string>();
  manifest.externalSurfaceNodes.forEach((sn, si) => {
    if (seenSurfaceId.has(sn.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate external surface id "${sn.id}"`,
        path: ['externalSurfaceNodes', si],
      });
    }
    seenSurfaceId.add(sn.id);
    if (screenIds.has(sn.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `external surface id "${sn.id}" collides with a screen id`,
        path: ['externalSurfaceNodes', si],
      });
    }
    if (decisionIds.has(sn.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `external surface id "${sn.id}" collides with a decision node id`,
        path: ['externalSurfaceNodes', si],
      });
    }
    for (const [outcome, target] of Object.entries(sn.outcomes)) {
      if (target != null && !jumpTargets.has(target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `external surface "${sn.id}" outcome "${outcome}" target "${target}" not found`,
          path: ['externalSurfaceNodes', si, 'outcomes', outcome],
        });
      }
    }
    if (sn.fallback != null && !jumpTargets.has(sn.fallback)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `external surface "${sn.id}" fallback "${sn.fallback}" not found`,
        path: ['externalSurfaceNodes', si, 'fallback'],
      });
    }
  });

  return { screenIds, decisionIds, surfaceIds };
};
