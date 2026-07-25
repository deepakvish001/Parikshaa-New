import { useEffect } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { extractHandle, type PlatformKey } from "@/hooks/useCodingPlatformsStats";

export interface RatingPoint {
  ts: number; // unix seconds
  rating: number;
  label?: string;
  rank?: number | null;
  delta?: number | null;
}

export interface RatingSeries {
  platform: "leetcode" | "codeforces" | "codechef";
  handle: string;
  points: RatingPoint[];
  peak: number | null;
  sync_status: "ok" | "error";
  sync_error?: string;
}

interface HistoryHandles {
  codeforces?: string | null;
  codechef?: string | null;
}

// ---------- Persistent cache (localStorage) ----------
const CACHE_PREFIX = "rh-cache:v1:";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const readCache = (key: string): RatingSeries | undefined => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { ts: number; data: RatingSeries };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return;
    return parsed.data;
  } catch {
    return;
  }
};

const writeCache = (key: string, data: RatingSeries) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* quota — ignore */
  }
};

// ---------- In-flight de-duplication ----------
// React Query already de-dupes by queryKey within a single QueryClient, but this
// extra map guarantees only one network call is in flight even across StrictMode
// double-mounts or rapid hook recreations.
const inflight = new Map<string, Promise<RatingSeries>>();

const fetchRatingHistory = async (
  platform: "codeforces" | "codechef",
  handle: string,
): Promise<RatingSeries> => {
  const key = `${platform}:${handle}`;
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    const { data, error } = await supabase.functions.invoke("fetch-coding-profiles", {
      body: { platform, handle, mode: "rating_history" },
    });
    if (error) throw error;
    const series = data as RatingSeries;
    if (series?.sync_status === "ok") writeCache(key, series);
    return series;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, p);
  return p;
};

/**
 * Fetches contest rating history for non-LeetCode platforms in parallel.
 *
 * Caching strategy:
 *  - React Query de-dupes concurrent fetches by queryKey.
 *  - An in-flight Map de-dupes across query-client boundaries / StrictMode.
 *  - localStorage acts as a persistent 24h cache so reloads show data instantly
 *    while a fresh fetch happens in the background.
 *
 * Real-time strategy (no polling):
 *  - Refetches on window focus, network reconnect, and a Supabase Realtime
 *    broadcast channel ("rating-history") that any client can emit on
 *    successful refresh — keeping open tabs/devices in sync without timers.
 *  - A BroadcastChannel mirrors the same event across tabs in the same browser.
 */
export const useRatingHistory = (handles: HistoryHandles) => {
  const queryClient = useQueryClient();

  const entries: { platform: "codeforces" | "codechef"; handle: string }[] = [];
  (["codeforces", "codechef"] as const).forEach((p) => {
    const h = extractHandle(p as PlatformKey, handles[p]);
    if (h) entries.push({ platform: p, handle: h });
  });

  const queries = useQueries({
    queries: entries.map(({ platform, handle }) => ({
      queryKey: ["rating-history", platform, handle] as const,
      queryFn: () => fetchRatingHistory(platform, handle),
      initialData: () => readCache(`${platform}:${handle}`),
      initialDataUpdatedAt: () => {
        try {
          const raw = localStorage.getItem(CACHE_PREFIX + `${platform}:${handle}`);
          return raw ? JSON.parse(raw).ts : undefined;
        } catch { return undefined; }
      },
      // No interval — pushes drive refresh.
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: false,
      retry: 1,
    })),
  });

  // ---------- Supabase Realtime broadcast + cross-tab sync ----------
  useEffect(() => {
    if (entries.length === 0) return;

    const invalidate = (platform?: string, handle?: string) => {
      entries.forEach((e) => {
        if (platform && handle && (e.platform !== platform || e.handle !== handle)) return;
        queryClient.invalidateQueries({ queryKey: ["rating-history", e.platform, e.handle] });
      });
    };

    // Supabase Realtime (works across devices/users with same handle)
    const channel = supabase.channel("rating-history", { config: { broadcast: { self: false } } });
    channel
      .on("broadcast", { event: "refresh" }, (payload) => {
        const { platform, handle } = (payload.payload ?? {}) as { platform?: string; handle?: string };
        invalidate(platform, handle);
      })
      .subscribe();

    // BroadcastChannel (instant cross-tab in same browser)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("rating-history");
      bc.onmessage = (ev) => {
        const { platform, handle } = ev.data ?? {};
        invalidate(platform, handle);
      };
    } catch { /* unsupported */ }

    return () => {
      supabase.removeChannel(channel);
      bc?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, entries.map((e) => `${e.platform}:${e.handle}`).join("|")]);

  // After our own successful fetches, notify peers so they refresh too.
  useEffect(() => {
    queries.forEach((q, i) => {
      if (!q.isFetched || q.isFetching || !q.data || q.data.sync_status !== "ok") return;
      const { platform, handle } = entries[i];
      try {
        const bc = new BroadcastChannel("rating-history");
        bc.postMessage({ platform, handle });
        bc.close();
      } catch { /* noop */ }
      supabase.channel("rating-history").send({
        type: "broadcast",
        event: "refresh",
        payload: { platform, handle },
      }).catch(() => { /* noop */ });
    });
    // Only react to fetch completions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.map((q) => `${q.dataUpdatedAt}:${q.isFetching}`).join("|")]);

  const byPlatform: Partial<Record<
    "codeforces" | "codechef",
    {
      data?: RatingSeries;
      isLoading: boolean;
      isFetching: boolean;
      isError: boolean;
      error?: unknown;
      refetch: () => void;
    }
  >> = {};
  entries.forEach(({ platform }, i) => {
    const q = queries[i];
    byPlatform[platform] = {
      data: q.data,
      isLoading: q.isLoading,
      isFetching: q.isFetching,
      isError: q.isError || q.data?.sync_status === "error",
      error: q.error ?? (q.data?.sync_status === "error" ? q.data?.sync_error : undefined),
      refetch: () => q.refetch(),
    };
  });
  return byPlatform;
};
