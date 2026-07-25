import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Query keys touched by any coding_problems change. Exported so tests and
// optimistic helpers stay in sync with the realtime listener.
export const CODING_PROBLEMS_QUERY_KEYS = [
  ["coding-problems-db"],
  ["coding-problems", "published-count"],
  ["admin-problems"],
] as const;

const invalidateAll = (qc: QueryClient) => {
  for (const key of CODING_PROBLEMS_QUERY_KEYS) {
    qc.invalidateQueries({ queryKey: key as unknown as string[] });
  }
};

/**
 * Optimistically bump the published-count cache and return a rollback fn.
 * Use around an upload/publish mutation so both admin + library counters
 * move instantly and revert cleanly on failure.
 */
export const optimisticProblemCountDelta = (qc: QueryClient, delta: number) => {
  const key = ["coding-problems", "published-count"];
  const prev = qc.getQueryData<number>(key);
  if (typeof prev === "number") {
    qc.setQueryData<number>(key, Math.max(0, prev + delta));
  }
  return () => {
    if (typeof prev === "number") qc.setQueryData<number>(key, prev);
  };
};

/**
 * Subscribe to `coding_problems` changes and invalidate the library +
 * admin queries so both sides stay in sync in realtime. Bursts of events
 * (e.g. bulk uploads) are coalesced through a trailing-edge throttle so we
 * refetch at most once per `throttleMs` window while still catching the
 * final state.
 */
export const useCodingProblemsRealtime = (throttleMs = 400) => {
  const qc = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastRun = 0;

    const schedule = () => {
      const now = Date.now();
      const wait = Math.max(0, throttleMs - (now - lastRun));
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer = null;
        invalidateAll(qc);
      }, wait);
    };

    const channel = supabase
      .channel("coding-problems-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coding_problems" },
        schedule,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [qc, throttleMs]);
};
