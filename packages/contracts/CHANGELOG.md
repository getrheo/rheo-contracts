# Changelog

All notable changes to `@getrheo/contracts` and the aligned publish graph are documented here.

## 2.0.2 — 2026-06-29

**Patch:** Coordinated release to validate public-repo tag → npm CI. npm package metadata now includes `repository` and `bugs` pointing at public GitHub repos. No API or manifest schema changes.

## 2.0.1 — 2026-06-29

**Patch:** ESM relative import fix in published `dist/` tarballs (`fixEsmRelativeImports` in build script).


**Breaking:** Platform-only export paths removed from `@getrheo/contracts`. Use `@rheo/platform-contracts` inside the Rheo monorepo only — these paths were never supported for app integration.

Removed npm subpaths:

- `./dashboard`
- `./planEntitlements`
- `./workspaceCapabilities`
- `./billingPeriod`
- `./flowTemplates`
- `./flowTemplateComments`

**Breaking:** `@getrheo/flow-runtime` no longer exports `./agentPrompt` or `./buildFlowPreview` (platform/agent code only).

Upgrade from `1.0.1` if you deep-imported any of the above. Documented SDK install flows (`@getrheo/react-native-expo`, `@getrheo/react-native-bare`) are unchanged.
