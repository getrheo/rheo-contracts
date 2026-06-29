import { IMAGE_MIME_TYPES } from './constants/index';

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

const IMAGE_MIME_SET = new Set<string>(IMAGE_MIME_TYPES);

const EXTENSION_TO_MIME: Record<string, ImageMimeType> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const MIME_ALIASES: Record<string, ImageMimeType> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
};

export const normalizeImageMimeType = (mime: string): ImageMimeType | null => {
  const lower = mime.toLowerCase().trim();
  const aliased = MIME_ALIASES[lower] ?? lower;
  return IMAGE_MIME_SET.has(aliased) ? (aliased as ImageMimeType) : null;
};

export const imageMimeTypeFromFilename = (filename: string): ImageMimeType | null => {
  const lower = filename.toLowerCase();
  for (const [ext, mime] of Object.entries(EXTENSION_TO_MIME)) {
    if (lower.endsWith(ext)) return mime;
  }
  return null;
};

/** Resolve a dashboard/API image content type from browser File.type and filename. */
export const resolveImageUploadContentType = (
  filename: string,
  fileType?: string,
): ImageMimeType => {
  const fromMime = fileType?.trim() ? normalizeImageMimeType(fileType) : null;
  if (fromMime) return fromMime;
  const fromName = imageMimeTypeFromFilename(filename);
  if (fromName) return fromName;
  throw new Error(
    `Unsupported image file "${filename}". Use PNG, JPEG, WebP, GIF, or SVG.`,
  );
};

export const isSvgImageMimeType = (contentType: string): boolean =>
  normalizeImageMimeType(contentType) === 'image/svg+xml';

export const isSvgMediaUrl = (url: string): boolean => {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  return path.endsWith('.svg');
};
