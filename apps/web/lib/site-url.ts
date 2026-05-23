/**
 * Canonical site URL for metadata / Open Graph (optional).
 * Prefer `NEXT_PUBLIC_SITE_URL` (e.g. https://example.com). On Vercel, `VERCEL_URL` is used as fallback.
 */
export function siteMetadataBase(): URL | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_URL?.trim();
  const raw = explicit || vercel;
  if (!raw) return undefined;
  const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
  try {
    return new URL(withProto);
  } catch {
    return undefined;
  }
}
