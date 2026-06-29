/**
 * External URLs for {@link HyperlinkLayer}: `https` and `mailto` only.
 * Used by Zod refinements and SDK analytics helpers.
 */
export type ParsedHyperlinkHref =
  | { ok: true; scheme: 'https'; host: string }
  | { ok: true; scheme: 'mailto' }
  | { ok: false };

export const parseHyperlinkHref = (raw: string): ParsedHyperlinkHref => {
  const t = raw.trim();
  if (!t) return { ok: false };
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return { ok: false };
  }
  const scheme = u.protocol.replace(/:$/, '').toLowerCase();
  if (scheme === 'https') {
    if (!u.hostname) return { ok: false };
    return { ok: true, scheme: 'https', host: u.hostname };
  }
  if (scheme === 'mailto') {
    return { ok: true, scheme: 'mailto' };
  }
  return { ok: false };
};
