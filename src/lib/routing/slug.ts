/**
 * Slug + UUID helpers used to detect whether a route param is a UUID or a
 * human-readable slug, and to fall back gracefully in either direction.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): boolean {
  return !!value && UUID_RE.test(value);
}

/** Client-side slugify mirror of the Postgres slugify() function. */
export function slugify(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Normalize a blog slug that may include category segments and/or messy input
 * from a pasted URL. Handles:
 *  - percent-encoded characters (%2F, spaces, accents)
 *  - leading/trailing slashes and duplicate slashes
 *  - uppercase, whitespace, unicode diacritics
 *  - stray query/hash fragments accidentally included
 *  - non-alphanumeric noise inside each segment (kept as `-`)
 */
export function normalizeBlogSlug(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = String(raw).trim();
  // Strip query/hash if a full URL or pasted path leaked in
  s = s.split("#")[0].split("?")[0];
  // Drop protocol + host if present
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  // Drop leading /blog/ prefix if present
  s = s.replace(/^\/+/, "").replace(/^blog\//i, "");
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep raw on malformed encoding */
  }
  const segments = s
    .split("/")
    .map((seg) =>
      seg
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean);
  return segments.join("/");
}

/** Returns the most human-readable identifier available for a record. */
export function preferSlug<T extends { id: string; slug?: string | null }>(
  rec: T | null | undefined,
): string {
  if (!rec) return "";
  return (rec.slug && rec.slug.trim()) || rec.id;
}
