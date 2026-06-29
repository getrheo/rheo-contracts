import { describe, expect, it } from 'vitest';
import { mergeMediaFileNameStem, splitMediaFileName } from './mediaFileName.js';

describe('mediaFileName', () => {
  it('splitMediaFileName separates stem and extension', () => {
    expect(splitMediaFileName('hero-banner.png')).toEqual({
      stem: 'hero-banner',
      extension: '.png',
    });
  });

  it('mergeMediaFileNameStem preserves extension from current name', () => {
    expect(mergeMediaFileNameStem('new-title', 'old.json', 'application/json')).toBe(
      'new-title.json',
    );
  });

  it('mergeMediaFileNameStem infers extension from content type when missing', () => {
    expect(mergeMediaFileNameStem('photo', null, 'image/webp')).toBe('photo.webp');
  });
});
