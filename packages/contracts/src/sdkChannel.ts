import { z } from 'zod';
import { BannerManifestSchema, type BannerManifest } from './bannerManifest';
import { CodeParametersSchema, type CodeParameters } from './contentKind';
import { BrandingSchema } from './branding';
import { ResolvedAppIntegrationsSchema } from './appIntegrations';
import {
  SdkResolveExperimentSchema,
  SdkResolveResponseSchema,
  type SdkResolveExperiment,
  type SdkResolveResponse,
} from './sdk';

export type SdkCodeResolveResponse = {
  kind: 'code';
  channelId: string;
  environment: 'test' | 'live';
  assignmentVersion: number;
  experiment: SdkResolveExperiment | null;
  variantKey: string;
  parameters: z.infer<typeof CodeParametersSchema>;
};

export const SdkCodeResolveResponseSchema: z.ZodType<SdkCodeResolveResponse> = z.object({
  kind: z.literal('code'),
  channelId: z.string(),
  environment: z.enum(['test', 'live']),
  assignmentVersion: z.number().int().nonnegative(),
  experiment: SdkResolveExperimentSchema.nullable(),
  variantKey: z.string().min(1),
  parameters: CodeParametersSchema,
}) as z.ZodType<SdkCodeResolveResponse>;

export type SdkBannerResolveResponse = {
  kind: 'banner';
  bannerId: string;
  versionId: string;
  versionNumber: number;
  assignmentVersion: number;
  environment: 'test' | 'live';
  channelId: string;
  experimentId: string | null;
  variantId: string | null;
  experiment: SdkResolveExperiment | null;
  manifest: BannerManifest;
  mediaMap: Record<string, string>;
  branding?: z.infer<typeof BrandingSchema>;
  features?: { attribution: boolean };
  integrations: z.infer<typeof ResolvedAppIntegrationsSchema>;
  /** True when the bucketed experiment arm is the control (render nothing). */
  control?: boolean;
};

export const SdkBannerResolveResponseSchema: z.ZodType<SdkBannerResolveResponse> = z.object({
  kind: z.literal('banner'),
  bannerId: z.string().uuid(),
  versionId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  assignmentVersion: z.number().int().nonnegative(),
  environment: z.enum(['test', 'live']),
  channelId: z.string(),
  experimentId: z.string().uuid().nullable(),
  variantId: z.string().nullable(),
  experiment: SdkResolveExperimentSchema.nullable(),
  manifest: BannerManifestSchema,
  mediaMap: z.record(z.string(), z.string().url()),
  branding: BrandingSchema.optional(),
  features: z
    .object({
      attribution: z.boolean(),
    })
    .optional(),
  integrations: ResolvedAppIntegrationsSchema,
  control: z.boolean().optional(),
}) as z.ZodType<SdkBannerResolveResponse>;

export type SdkChannelResolveResponse =
  | SdkResolveResponse
  | SdkCodeResolveResponse
  | SdkBannerResolveResponse;

/**
 * Batch resolve. Unknown `kind` values are dropped so older clients keep
 * working when a new content kind appears.
 */
export type SdkResolveAllResponse = {
  channels: SdkChannelResolveResponse[];
};

/** Stable JSON of a flat parameter object, keys sorted, for ETag hashing. */
export const stableCodeParametersJson = (parameters: CodeParameters): string =>
  JSON.stringify(parameters, Object.keys(parameters).sort());

const sha256Hex = (message: string): string => {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));
  const maxWord = 2 ** 32;
  const words: number[] = [];
  const hash = new Array<number>(8);
  const k = new Array<number>(64);
  const isComposite: Record<number, number> = {};
  let primeCounter = 0;
  for (let candidate = 2; primeCounter < 64; candidate += 1) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (candidate ** 0.5 * maxWord) | 0;
      k[primeCounter] = (candidate ** (1 / 3) * maxWord) | 0;
      primeCounter += 1;
    }
  }
  const bitLength = message.length * 8;
  let ascii = `${message}\x80`;
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i += 1) {
    words[i >> 2] = (words[i >> 2] ?? 0) | (ascii.charCodeAt(i) << (((3 - i) % 4) * 8));
  }
  words[words.length] = (bitLength / maxWord) | 0;
  words[words.length] = bitLength;
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i += 1) {
      const w15 = w[i - 15] ?? 0;
      const w2 = w[i - 2] ?? 0;
      const a = hash[0] ?? 0;
      const e = hash[4] ?? 0;
      const temp1 =
        (hash[7] ?? 0) +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & (hash[5] ?? 0)) ^ (~e & (hash[6] ?? 0))) +
        (k[i] ?? 0) +
        (w[i] =
          i < 16
            ? (w[i] ?? 0)
            : ((w[i - 16] ?? 0) +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                (w[i - 7] ?? 0) +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & (hash[1] ?? 0)) ^ (a & (hash[2] ?? 0)) ^ ((hash[1] ?? 0) & (hash[2] ?? 0)));
      hash.unshift((temp1 + temp2) | 0);
      hash[4] = ((hash[4] ?? 0) + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i += 1) hash[i] = ((hash[i] ?? 0) + (oldHash[i] ?? 0)) | 0;
  }
  let result = '';
  for (let i = 0; i < 8; i += 1) {
    for (let b = 3; b >= 0; b -= 1) {
      const byte = ((hash[i] ?? 0) >> (b * 8)) & 255;
      result += byte.toString(16).padStart(2, '0');
    }
  }
  return result;
};

export const codeParametersEtagHash = (parameters: CodeParameters): string =>
  sha256Hex(stableCodeParametersJson(parameters)).slice(0, 12);

export const codeResolveEtag = (
  assignmentVersion: number,
  variantKey: string,
  parameters: CodeParameters,
): string => `"${assignmentVersion}-${variantKey}-${codeParametersEtagHash(parameters)}"`;

export const parseSdkResolveAllResponse = (input: unknown): SdkResolveAllResponse => {
  const body = z.object({ channels: z.array(z.unknown()) }).parse(input);
  const channels: SdkChannelResolveResponse[] = [];
  for (const entry of body.channels) {
    const kind = z.object({ kind: z.string() }).safeParse(entry);
    if (!kind.success) continue;
    if (kind.data.kind === 'flow') {
      const parsed = SdkResolveResponseSchema.safeParse(entry);
      if (parsed.success) channels.push(parsed.data);
      continue;
    }
    if (kind.data.kind === 'code') {
      const parsed = SdkCodeResolveResponseSchema.safeParse(entry);
      if (parsed.success) channels.push(parsed.data);
      continue;
    }
    if (kind.data.kind === 'banner') {
      const parsed = SdkBannerResolveResponseSchema.safeParse(entry);
      if (parsed.success) channels.push(parsed.data);
    }
  }
  return { channels };
};

export const bannerResolveEtag = (assignmentVersion: number, versionId: string): string =>
  `"${assignmentVersion}-${versionId}"`;
