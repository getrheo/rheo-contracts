# Changelog

All notable changes to `@getrheo/contracts` and the aligned publish graph are documented here.

## 3.0.0 — 2026-10-07

**Major:** New coordinated publish-graph baseline.

- Aligns all `@getrheo/*` npm packages, platform pins, and public-repo release tags on **`3.0.0`**.
- Establishes the 3.x train as the install/default pin for platform consumers and example apps.
- No intentional manifest or SDK wire-format break in this cut; major bump is the coordinated baseline for the next public release train.

Upgrade clients to **`3.0.0`** (npm / `flutter-v3.0.0` when tagged; SwiftUI public mirror remains paused).

## 2.6.0 — 2026-08-07

**Minor:** Coordinated publish-graph release.

- **Form input layers** — `date_time_input`, `number_stepper` (+ `number_stepper_button` / `number_stepper_value`), `phone_input`, `address_input` with field classification and Continue-button capture rules.
- **Native form UX** — text input helper text, validation mode, autocapitalize, return key; email/password `passwordRules` (min/max length, composition flags); screen `insetSafeArea`.
- **Runtime / SDKs** — React Native renders the new inputs (native date/time pickers), password-rule validation, and safe-area insets; builder multi-edit / find-replace are dashboard-only.
- **Experiments** — primary metric kinds (completion, paywall purchase, scoped custom events by field key / step id) in platform contracts.

Upgrade clients to **`2.6.0`** before publishing flows that use the new form inputs or password rules.

## 2.5.0 — 2026-08-02

**Minor:** Coordinated publish-graph release.

- **Headless external surfaces** — optional `config.hostKey` on `externalSurfaceNodes` for host registry lookup (falls back to node id). Builder splits **Integration Node** (partner providers) from **External Surface Node** (`provider: "headless"`).
- **SDKs** — React Native, SwiftUI, and Flutter resolve `externalSurfaces` by `hostKey` when set; headless helper/types for host-rendered UI.
- **Skill / agent** — import and scaffold rules updated for headless surfaces and host keys.

Upgrade clients to **`2.5.0`** (npm / `swiftui-v2.5.0` / `flutter-v2.5.0`) before relying on custom host keys.

## 2.4.0 — 2026-07-30

**Minor:** Coordinated publish-graph release.

- **`conditional` layer** — ordered `DecisionExpr` cases plus required else stack; path-aware input / auth exclusivity; above-only field refs; incomplete case expressions allowed in drafts and blocked at publish (`conditional.incomplete_cases`).
- **`advance_carousel` button action** — buttons may target a same-screen carousel layer to page forward.
- **Runtime** — `@getrheo/flow-runtime` exports `./conditionalBranch` (resolve active branch, prune vacated responses, screen rewrite helpers).
- **SDKs** — Web, React Native, Flutter, and SwiftUI render Conditional and Advance carousel; branding font hydration/registration improvements on native clients.
- **Skill / agent** — import and flow-creation rules updated for Conditional and path-aware inputs.

Upgrade clients to **`2.4.0`** (npm / `swiftui-v2.4.0` / `flutter-v2.4.0`) before publishing flows that use the new layer or action.

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
