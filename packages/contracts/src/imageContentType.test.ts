import { describe, expect, it } from 'vitest';
import {
  imageMimeTypeFromFilename,
  isSvgMediaUrl,
  normalizeImageMimeType,
  resolveImageUploadContentType,
} from './imageContentType';

describe('imageContentType', () => {
  it('normalizes image/jpg alias', () => {
    expect(normalizeImageMimeType('image/jpg')).toBe('image/jpeg');
  });

  it('accepts image/svg+xml', () => {
    expect(normalizeImageMimeType('image/svg+xml')).toBe('image/svg+xml');
  });

  it('infers webp from filename when browser File.type is empty', () => {
    expect(resolveImageUploadContentType('hero.webp', '')).toBe('image/webp');
    expect(resolveImageUploadContentType('hero.webp')).toBe('image/webp');
  });

  it('infers svg from filename', () => {
    expect(imageMimeTypeFromFilename('icons/logo.svg')).toBe('image/svg+xml');
    expect(resolveImageUploadContentType('logo.svg', 'application/octet-stream')).toBe(
      'image/svg+xml',
    );
  });

  it('detects svg URLs', () => {
    expect(isSvgMediaUrl('https://cdn.example.com/a/logo.svg')).toBe(true);
    expect(isSvgMediaUrl('https://cdn.example.com/a/logo.svg?v=1')).toBe(true);
    expect(isSvgMediaUrl('https://cdn.example.com/a/logo.png')).toBe(false);
  });
});
