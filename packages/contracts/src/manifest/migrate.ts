import { migrateLegacyDecisionNodeInPlace } from '../decisions.js';
import { MANIFEST_SCHEMA_VERSION } from './version.js';

/**
 * Walk an arbitrary layer-tree-shaped object and migrate legacy shapes
 * in-place to the current schema. Currently:
 *
 * - Pre-2026 button layers stored their content as a single `label`
 *   `LocalizedText`. The new shape is a stack-like container with
 *   `children`. We convert by wrapping the old label in a Text child so
 *   styling, translations and the editor all work consistently.
 *
 * - Older `hyperlink` layers stored link copy on the node as `text` + text
 *   styles. The current shape nests that in a Text child under `children`,
 *   mirroring other container layers.
 *
 * - Legacy `progress_bar` layer kind is renamed to `progress`.
 *
 * - Legacy `sf_symbol` icon layers are remapped to Ionicons (`star-outline`)
 *   so manifests authored before SF Symbols removal still parse.
 *
 * Safe to call on already-current shapes — it's a no-op in that case.
 */
const migrateLayerInPlace = (layer: unknown): void => {
  if (!layer || typeof layer !== 'object') return;
  const l = layer as Record<string, unknown>;
  if (l.kind === 'progress_bar') {
    l.kind = 'progress';
  }
  if (l.kind === 'icon' && l.family === 'sf_symbol') {
    l.family = 'ionicons';
    l.iconName = 'star-outline';
  }
  if (l.kind === 'button') {
    const hasChildren = Array.isArray(l.children);
    const hasLegacyLabel = !!l.label && typeof l.label === 'object';
    if (!hasChildren && hasLegacyLabel) {
      const id = typeof l.id === 'string' ? `${l.id}_text` : 'lyr_btn_text';
      l.children = [
        {
          id,
          kind: 'text',
          text: l.label,
        },
      ];
      delete l.label;
    } else if (!hasChildren) {
      l.children = [];
    }
  }
  if (l.kind === 'hyperlink') {
    const hasKids = Array.isArray(l.children) && l.children.length > 0;
    const hasLegacyText = l.text !== undefined && l.text !== null;
    if (!hasKids && hasLegacyText) {
      const baseId = typeof l.id === 'string' ? `${l.id}_lnktxt` : 'lyr_hyperlink_lnktxt';
      const row: Record<string, unknown> = {
        id: String(baseId).slice(0, 64),
        kind: 'text',
        text: l.text,
      };
      if (l.style !== undefined) row.style = l.style;
      if (l.styleBreakpoints !== undefined) row.styleBreakpoints = l.styleBreakpoints;
      l.children = [row];
      delete l.text;
      delete l.style;
      delete l.styleBreakpoints;
    } else if (!Array.isArray(l.children)) {
      l.children = [];
    }
  }
  if (l.kind === 'stack' && Array.isArray(l.children)) {
    for (const c of l.children) migrateLayerInPlace(c);
  } else if (l.kind === 'carousel' && Array.isArray(l.slides)) {
    for (const s of l.slides) migrateLayerInPlace(s);
  } else if (l.kind === 'button' && Array.isArray(l.children)) {
    for (const c of l.children) migrateLayerInPlace(c);
  } else if (l.kind === 'back_button' && Array.isArray(l.children)) {
    for (const c of l.children) migrateLayerInPlace(c);
  } else if (l.kind === 'hyperlink' && Array.isArray(l.children)) {
    for (const c of l.children) migrateLayerInPlace(c);
  } else if (l.kind === 'oauth_login' && Array.isArray(l.children)) {
    for (const c of l.children) migrateLayerInPlace(c);
  } else if (
    l.kind === 'oauth_provider' &&
    (l as { variant?: string }).variant === 'custom' &&
    Array.isArray((l as { children?: unknown[] }).children)
  ) {
    for (const c of (l as { children: unknown[] }).children) migrateLayerInPlace(c);
  } else if (
    l.kind === 'email_password_auth' &&
    Array.isArray((l as { children?: unknown[] }).children)
  ) {
    for (const c of (l as { children: unknown[] }).children) migrateLayerInPlace(c);
  } else if (l.kind === 'email_password_field' && Array.isArray((l as { children?: unknown[] }).children)) {
    for (const c of (l as { children: unknown[] }).children) migrateLayerInPlace(c);
  } else if (l.kind === 'email_password_submit' && Array.isArray((l as { children?: unknown[] }).children)) {
    for (const c of (l as { children: unknown[] }).children) migrateLayerInPlace(c);
  } else if (
    (l.kind === 'single_choice' || l.kind === 'multiple_choice') &&
    Array.isArray(l.children)
  ) {
    for (const c of l.children) migrateLayerInPlace(c);
  } else if (
    (l.kind === 'text_input' || l.kind === 'scale_input') &&
    Array.isArray((l as { children?: unknown[] }).children)
  ) {
    for (const c of (l as { children: unknown[] }).children) migrateLayerInPlace(c);
  }
};

const migrateScreenInPlace = (screen: unknown): void => {
  if (!screen || typeof screen !== 'object') return;
  const s = screen as {
    regions?: { header?: unknown; body?: unknown; footer?: unknown };
    animations?: unknown;
  };
  if (s.regions) {
    if (s.regions.header) migrateLayerInPlace(s.regions.header);
    if (s.regions.body) migrateLayerInPlace(s.regions.body);
    if (s.regions.footer) migrateLayerInPlace(s.regions.footer);
  }
  if (s.animations === undefined) {
    delete s.animations;
  }
};

const migrateManifestInPlace = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') return data;
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.screens)) {
    for (const s of d.screens) migrateScreenInPlace(s);
  }
  if (!Array.isArray(d.decisionNodes)) d.decisionNodes = [];
  if (Array.isArray(d.decisionNodes)) {
    for (const node of d.decisionNodes) {
      if (node && typeof node === 'object') {
        migrateLegacyDecisionNodeInPlace(node as Record<string, unknown>);
      }
    }
  }
  if (!Array.isArray(d.externalSurfaceNodes)) d.externalSurfaceNodes = [];
  if (!Array.isArray(d.sdkAttributeKeys)) d.sdkAttributeKeys = [];
  if (d.schemaVersion === 6) d.schemaVersion = MANIFEST_SCHEMA_VERSION;
  if (d.schemaVersion === 5) d.schemaVersion = MANIFEST_SCHEMA_VERSION;
  if (d.schemaVersion === 4) d.schemaVersion = MANIFEST_SCHEMA_VERSION;
  return data;
};

/**
 * Migrate a manifest-shaped value to the current schema, returning a new
 * object (input is not mutated). Safe to call on already-current
 * manifests — it's a no-op in that case. Use this before
 * `FlowManifestSchema.parse` when you might be loading data persisted
 * against a previous schema version.
 */
export const migrateLegacyManifest = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object') return raw;
  const clone = JSON.parse(JSON.stringify(raw));
  return migrateManifestInPlace(clone);
};
