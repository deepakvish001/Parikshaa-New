/**
 * Smooth-scroll to an element by id, accounting for the sticky header height.
 * Respects prefers-reduced-motion and updates the URL hash without a jump.
 *
 * The header measures itself on mount/resize and writes `--header-h` on
 * <html>. `resolveHeaderOffset()` prefers that live value so anchor jumps
 * and the scroll-spy trigger stay locked to the actual header height.
 */
export const HEADER_OFFSET_PX = 80;

export function resolveHeaderOffset(fallback: number = HEADER_OFFSET_PX): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--header-h")
    .trim();
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function scrollToId(id: string, offset?: number): boolean {
  const clean = id.replace(/^#/, "");
  const el = typeof document !== "undefined" ? document.getElementById(clean) : null;
  if (!el) return false;

  const reduce =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const activeOffset = offset ?? resolveHeaderOffset();
  const top = el.getBoundingClientRect().top + window.scrollY - activeOffset;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });

  if (typeof history !== "undefined") {
    history.replaceState(null, "", `#${clean}`);
  }
  return true;
}

export function scrollToHash(href: string, offset?: number): boolean {
  if (!href.startsWith("#")) return false;
  return scrollToId(href.slice(1), offset);
}
