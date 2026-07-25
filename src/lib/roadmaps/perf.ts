import { trackEvent } from "@/lib/analytics";

/** Threshold (ms) above which we log a warning + analytics event. */
const SLOW_MS = 50;

type PerfMeta = { slug?: string; sections?: number; resources?: number };

/**
 * Lightweight perf marker: measures `fn()` and logs when the run exceeds
 * SLOW_MS, or always in dev. Emits an analytics event for large roadmaps.
 */
export function measure<T>(label: string, fn: () => T, meta: PerfMeta = {}): T {
  const start =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const result = fn();
  const end =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const durationMs = Math.round((end - start) * 100) / 100;

  const isSlow = durationMs >= SLOW_MS;
  if (import.meta.env.DEV || isSlow) {
    // eslint-disable-next-line no-console
    console[isSlow ? "warn" : "debug"](
      `[roadmap-perf] ${label} ${durationMs}ms`,
      meta,
    );
  }
  if (isSlow) {
    trackEvent("roadmap_perf_slow", { label, durationMs, ...meta });
  }
  return result;
}
