/**
 * Centralized React-Query cache freshness config for external profile data
 * (LeetCode, Codeforces, CodeChef, GFG, HackerRank, GitHub, …).
 *
 * Override at build time with:
 *   VITE_PROFILE_STATS_STALE_MIN=15   # default 10
 *   VITE_PROFILE_STATS_GC_HOURS=24    # default 24
 */
const num = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const STALE_MIN = num(import.meta.env?.VITE_PROFILE_STATS_STALE_MIN, 10);
const GC_HOURS = num(import.meta.env?.VITE_PROFILE_STATS_GC_HOURS, 24);

export const PROFILE_STATS_STALE_MS = STALE_MIN * 60 * 1000;
export const PROFILE_STATS_GC_MS = GC_HOURS * 60 * 60 * 1000;

/** Defaults shared by every external-profile query. */
export const profileStatsQueryDefaults = {
  staleTime: PROFILE_STATS_STALE_MS,
  gcTime: PROFILE_STATS_GC_MS,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: true,
  retry: 1,
} as const;
