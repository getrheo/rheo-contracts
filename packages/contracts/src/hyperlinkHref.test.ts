import { describe, expect, it } from 'vitest';
import { parseHyperlinkHref } from './hyperlinkHref';

describe('parseHyperlinkHref', () => {
  it('accepts https with host', () => {
    expect(parseHyperlinkHref('https://example.com/privacy')).toEqual({
      ok: true,
      scheme: 'https',
      host: 'example.com',
    });
  });

  it('rejects empty', () => {
    expect(parseHyperlinkHref('').ok).toBe(false);
  });

  it('rejects http', () => {
    expect(parseHyperlinkHref('http://example.com').ok).toBe(false);
  });

  it('accepts mailto', () => {
    expect(parseHyperlinkHref('mailto:support@example.com')).toEqual({
      ok: true,
      scheme: 'mailto',
    });
  });
});
