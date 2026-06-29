import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageRoot = join(__dirname, '..');
const distIndexPath = join(packageRoot, 'dist/index.js');

const FORBIDDEN_DIST_MARKERS = [
  'planEntitlements',
  'getPlanEntitlements',
  'RolloutRequest',
  'WorkspacePlanEntitlements',
  'dashboard/flows',
];

const REQUIRED_DIST_MARKERS = ['BrandingSchema', 'collectCanvasGateViolations'];

const FORBIDDEN_DIST_FILES = ['dashboard.js', 'planEntitlements.js', 'workspaceCapabilities.js'];

describe('@getrheo/contracts publish dist leakage', () => {
  it('dist bundle excludes platform modules and includes SDK authoring surface', () => {
    expect(
      existsSync(distIndexPath),
      'dist/index.js missing — run pnpm build:publish-graph before tests',
    ).toBe(true);

    const indexJs = readFileSync(distIndexPath, 'utf8');
    for (const marker of FORBIDDEN_DIST_MARKERS) {
      expect(indexJs.includes(marker)).toBe(false);
    }
    for (const marker of REQUIRED_DIST_MARKERS) {
      expect(indexJs.includes(marker)).toBe(true);
    }
    for (const file of FORBIDDEN_DIST_FILES) {
      expect(existsSync(join(packageRoot, 'dist', file))).toBe(false);
    }
  });
});
