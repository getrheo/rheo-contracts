#!/usr/bin/env node
/**
 * Public-repo guardrail: @getrheo/contracts must not export platform paths.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pkgPath = join(process.cwd(), 'packages/contracts/package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const FORBIDDEN = [
  'dashboard',
  'planEntitlements',
  'workspaceCapabilities',
  'billingPeriod',
  'flowTemplates',
  'flowTemplateComments',
];

const errors = [];
for (const key of FORBIDDEN) {
  const exportKey = `./${key}`;
  if (pkg.exports?.[exportKey] || pkg.publishConfig?.exports?.[exportKey]) {
    errors.push(`forbidden export path: ${exportKey}`);
  }
}

if (errors.length > 0) {
  console.error('check-public-exports failed:');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log('check-public-exports passed');
