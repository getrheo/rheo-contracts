const CONTENT_TYPE_EXTENSION: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'application/json': '.json',
  'text/json': '.json',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

export const splitMediaFileName = (
  name: string | null | undefined,
): { stem: string; extension: string } => {
  const raw = name?.trim() ?? '';
  if (!raw) return { stem: '', extension: '' };
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return { stem: raw, extension: '' };
  return { stem: raw.slice(0, dot), extension: raw.slice(dot) };
};

export const mediaExtensionFromContentType = (contentType: string): string =>
  CONTENT_TYPE_EXTENSION[contentType] ?? '';

/** Display/edit stem only; persisted name keeps the original or inferred extension. */
export const mergeMediaFileNameStem = (
  stem: string,
  currentName: string | null | undefined,
  contentType: string,
): string => {
  const trimmed = stem.trim();
  const { extension } = splitMediaFileName(currentName);
  const ext = extension || mediaExtensionFromContentType(contentType);
  return ext ? `${trimmed}${ext}` : trimmed;
};
