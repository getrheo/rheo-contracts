import { z } from 'zod';
import { collectDecisionFieldKeysFromNode } from '../decisions.js';
import type { FlowManifestObjectBase } from './flowManifestObjectBaseSchema.js';
import { buildManifestJumpTargets, refineManifestGraph } from './refineManifestGraph.js';
import { refineManifestScreens } from './refineManifestScreens.js';

export const refineFlowManifest = (
  manifest: FlowManifestObjectBase,
  ctx: z.RefinementCtx,
): void => {
  const jumpTargets = buildManifestJumpTargets(manifest);
  const { screenIds } = refineManifestGraph(manifest, ctx, jumpTargets);
  const allFieldKeys = new Map<string, string>();
  refineManifestScreens(manifest, ctx, jumpTargets, screenIds, allFieldKeys);

  manifest.decisionNodes.forEach((dn, di) => {
    for (const fk of collectDecisionFieldKeysFromNode(dn)) {
      if (!allFieldKeys.has(fk)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `decision "${dn.id}" references unknown fieldKey "${fk}"`,
          path: ['decisionNodes', di, 'cases'],
        });
      }
    }
  });

  if (manifest.locales.length > 0 && !manifest.locales.includes(manifest.defaultLocale)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `defaultLocale "${manifest.defaultLocale}" must be in locales`,
      path: ['defaultLocale'],
    });
  }
};
