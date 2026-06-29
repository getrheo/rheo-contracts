#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const targetVersion = process.env.TARGET_VERSION ?? JSON.parse(
  readFileSync(join(repoRoot, 'packages/contracts/package.json'), 'utf8'),
).version;

const PUBLISH_PACKAGES = [
  { name: '@getrheo/contracts', dir: 'packages/contracts', expectsDist: true },
];

const errors = [];

for (const { name, dir, expectsDist } of PUBLISH_PACKAGES) {
  const pkgPath = join(repoRoot, dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

  if (pkg.version !== targetVersion) {
    errors.push(`${name}: version ${pkg.version} !== ${targetVersion}`);
  }
  if (!pkg.license) errors.push(`${name}: missing license`);
  if (!pkg.homepage) errors.push(`${name}: missing homepage`);
  if (!pkg.repository?.url) errors.push(`${name}: missing repository.url`);
  if (!pkg.files?.length) errors.push(`${name}: missing files`);
  if (pkg.publishConfig?.access !== 'public') {
    errors.push(`${name}: publishConfig.access must be public`);
  }
  if (expectsDist && !existsSync(join(repoRoot, dir, 'dist/index.js'))) {
    errors.push(`${name}: dist/index.js missing — run pnpm build`);
  }
}

if (errors.length > 0) {
  console.error('npm publish graph check failed:');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log(`npm publish graph check passed (${PUBLISH_PACKAGES.length} packages @ ${targetVersion})`);
