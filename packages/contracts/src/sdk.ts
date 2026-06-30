import { z } from 'zod';
import { ResolvedAppIntegrationsSchema } from './appIntegrations';

/** Default HTTPS API origin for SDK resolve/events when hosts omit `apiBaseUrl`. */
export const RHEO_DEFAULT_SDK_API_BASE_URL = 'https://api.getrheo.io' as const;

/** SDK console diagnostics verbosity — set on `RheoProvider` (`logLevel` prop). */
export const SdkLogLevelSchema = z.enum(['silent', 'warn', 'debug']);
export type SdkLogLevel = z.infer<typeof SdkLogLevelSchema>;
export const DEFAULT_SDK_LOG_LEVEL: SdkLogLevel = 'silent';
import { BrandingSchema } from './branding';
import { FlowManifestSchema } from './manifest';
import { SdkContextSchema, SdkIdentitySchema } from './identity';

/**
 * Resolve request is app-scoped: the publishable key identifies the app and
 * channel, the channel's assignment chooses which flow version to serve. The
 * SDK never specifies a flowId — that's a server-side decision now.
 */
export const SdkResolveRequestSchema = z.object({
  identity: SdkIdentitySchema,
  context: SdkContextSchema.optional(),
});
export type SdkResolveRequest = z.infer<typeof SdkResolveRequestSchema>;

export const SdkResolveResponseSchema = z.object({
  flowId: z.string().uuid(),
  versionId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  /** Stable id clients can use as an ETag when re-fetching. */
  assignmentVersion: z.number().int().nonnegative(),
  environment: z.enum(['test', 'live']),
  /** PublicId of the channel that resolved this request (for client cache keys). */
  channelId: z.string(),
  experimentId: z.string().uuid().nullable(),
  variantId: z.string().nullable(),
  manifest: FlowManifestSchema,
  mediaMap: z.record(z.string(), z.string().url()),
  /** App branding (gradient presets, etc.) when present on the app record. */
  branding: BrandingSchema.optional(),
  /** Workspace-gated SDK capabilities for this resolve. */
  features: z
    .object({
      /** When false, the SDK should not start MMP attribution listeners (Indie / lapsed billing). */
      attribution: z.boolean(),
    })
    .optional(),
  /** Per-app integration toggles from the dashboard; SDK should respect these after resolve. */
  integrations: ResolvedAppIntegrationsSchema,
});
export type SdkResolveResponse = z.infer<typeof SdkResolveResponseSchema>;

/**
 * Batch resolve response for `POST /v1/sdk/resolve-all`. Returns one entry per
 * assigned channel in the publishable key's environment. Each entry has the
 * same shape as a single `/resolve`, so SDKs can drop them straight into the
 * per-channel manifest cache (channels that fail to resolve are omitted).
 */
export const SdkResolveAllResponseSchema = z.object({
  channels: z.array(SdkResolveResponseSchema),
});
export type SdkResolveAllResponse = z.infer<typeof SdkResolveAllResponseSchema>;

/** Resolve metadata without manifest/media (for tooling; terminal callbacks use {@link FlowTerminalCorrelationSchema}). */
export const SdkResolveAssignmentSchema = SdkResolveResponseSchema.omit({
  manifest: true,
  mediaMap: true,
});
export type SdkResolveAssignment = z.infer<typeof SdkResolveAssignmentSchema>;

/** Join keys for correlating a terminal event with analytics / dashboard (no integration flags). */
export const FlowTerminalCorrelationSchema = z.object({
  channelId: z.string(),
  flowId: z.string().uuid(),
  versionId: z.string().uuid(),
  assignmentVersion: z.number().int().nonnegative(),
  environment: z.enum(['test', 'live']),
  experimentId: z.string().uuid().nullable(),
  variantId: z.string().nullable(),
});
export type FlowTerminalCorrelation = z.infer<typeof FlowTerminalCorrelationSchema>;

export const FlowTerminalDeviceSchema = z.object({
  locale: z.string(),
  platform: z.string(),
  appVersion: z.string().optional(),
  customProperties: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});
export type FlowTerminalDevice = z.infer<typeof FlowTerminalDeviceSchema>;

/**
 * Consumer-oriented snapshot for `onFlowCompleted` / `onFlowAbandoned`: small JSON
 * suitable for POSTing to your API, CRM, or LLM prompts (`schemaVersion` bumps on breaking changes).
 */
export const FlowTerminalSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  terminal: z.enum(['completed', 'abandoned']),
  /** When the flow reached a terminal status (`FlowState.completedAt`). */
  occurredAt: z.string().nullable(),
  correlation: FlowTerminalCorrelationSchema,
  subject: SdkIdentitySchema,
  device: FlowTerminalDeviceSchema,
  /**
   * Normalized field-key → value summary (same shape as analytics completion map).
   * Includes every capture field from visited screens (input layers, checkboxes, OS permission keys):
   * keys with no recorded response appear as `null`. OAuth / email-password auth keys are omitted;
   * use auth provider callbacks for those.
   */
  answers: z.record(z.string(), z.unknown()),
  /** Single merged SDK/decision context at terminal time (host + attribution + patches). */
  traits: z.record(z.string(), z.unknown()),
  /** Walked screen / surface node ids when `includePathInTerminalPayload` is true. */
  path: z.array(z.string()).optional(),
  /** Raw step responses (minus auth keys) when `includeAnswerDetailInTerminalPayload` is true. */
  answersDetail: z.record(z.string(), z.unknown()).optional(),
  manifest: FlowManifestSchema.optional(),
});
export type FlowTerminalSnapshot = z.infer<typeof FlowTerminalSnapshotSchema>;

/** @deprecated Use {@link FlowTerminalSnapshotSchema}. */
export const SdkCompletionPayloadSchema = FlowTerminalSnapshotSchema;

/** @deprecated Use {@link FlowTerminalSnapshot} / {@link FlowTerminalSnapshotSchema}. */
export type SdkCompletionPayload = FlowTerminalSnapshot;
