import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useCodingProblemsRealtime,
  optimisticProblemCountDelta,
  CODING_PROBLEMS_QUERY_KEYS,
} from "@/hooks/useCodingProblemsRealtime";

// Capture the postgres_changes handler so tests can trigger it directly.
let capturedHandler: (() => void) | null = null;

vi.mock("@/integrations/supabase/client", () => {
  const channel = {
    on: (_evt: string, _filter: unknown, cb: () => void) => {
      capturedHandler = cb;
      return channel;
    },
    subscribe: () => channel,
  };
  return {
    supabase: {
      channel: () => channel,
      removeChannel: () => {},
    },
  };
});

const makeWrapper = (qc: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe("useCodingProblemsRealtime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    capturedHandler = null;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throttles rapid bursts into a single invalidation covering both library + admin keys", async () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHook(() => useCodingProblemsRealtime(400), { wrapper: makeWrapper(qc) });

    // Simulate 5 rapid uploads.
    for (let i = 0; i < 5; i++) capturedHandler?.();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // One flush → one invalidation per tracked key.
    expect(spy).toHaveBeenCalledTimes(CODING_PROBLEMS_QUERY_KEYS.length);
    const keys = spy.mock.calls.map((c) => (c[0] as any).queryKey);
    expect(keys).toEqual(expect.arrayContaining(CODING_PROBLEMS_QUERY_KEYS.map((k) => [...k])));
  });

  it("still fires a trailing invalidation after the throttle window", async () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHook(() => useCodingProblemsRealtime(200), { wrapper: makeWrapper(qc) });

    capturedHandler?.();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    capturedHandler?.();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    // Two windows → invalidated twice per key.
    expect(spy).toHaveBeenCalledTimes(CODING_PROBLEMS_QUERY_KEYS.length * 2);
  });
});

describe("optimisticProblemCountDelta", () => {
  it("bumps the shared published-count cache and rolls back on failure", () => {
    const qc = new QueryClient();
    qc.setQueryData(["coding-problems", "published-count"], 10);

    const rollback = optimisticProblemCountDelta(qc, +1);
    expect(qc.getQueryData(["coding-problems", "published-count"])).toBe(11);

    rollback();
    expect(qc.getQueryData(["coding-problems", "published-count"])).toBe(10);
  });

  it("never drops below zero", () => {
    const qc = new QueryClient();
    qc.setQueryData(["coding-problems", "published-count"], 0);
    optimisticProblemCountDelta(qc, -5);
    expect(qc.getQueryData(["coding-problems", "published-count"])).toBe(0);
  });

  it("no-ops when the cache is empty (nothing to optimistically update)", () => {
    const qc = new QueryClient();
    const rollback = optimisticProblemCountDelta(qc, +1);
    expect(qc.getQueryData(["coding-problems", "published-count"])).toBeUndefined();
    rollback();
    expect(qc.getQueryData(["coding-problems", "published-count"])).toBeUndefined();
  });
});
