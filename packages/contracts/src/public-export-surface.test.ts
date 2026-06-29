import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkgPath = resolve(__dirname, '../package.json');

describe('@getrheo/contracts export surface', () => {
  it('does not expose platform-only package.json export paths', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      exports?: Record<string, string>;
      publishConfig?: { exports?: Record<string, unknown> };
    };
    const keys = [
      ...Object.keys(pkg.exports ?? {}),
      ...Object.keys(pkg.publishConfig?.exports ?? {}).map((k) => `publish:${k}`),
    ];
    const forbidden = [
      './dashboard',
      './planEntitlements',
      './workspaceCapabilities',
      './billingPeriod',
      './flowTemplates',
      './flowTemplateComments',
    ];
    expect(keys).toMatchSnapshot();
    for (const key of forbidden) {
      expect(pkg.exports?.[key]).toBeUndefined();
      expect(pkg.publishConfig?.exports?.[key]).toBeUndefined();
    }
  });
});
