import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { profileStatsQueryDefaults } from "@/lib/cacheConfig";

export type PlatformKey =
  | "leetcode"
  | "codeforces"
  | "codechef"
  | "geeksforgeeks"
  | "hackerrank";

export interface NormalizedPlatformStats {
  platform: PlatformKey;
  handle: string;
  rating: number | null;
  solved: { easy: number; medium: number; hard: number; total: number };
  confidence: "high" | "medium" | "low";
  sync_status: "ok" | "error";
  sync_error?: string;
}

/** Extract username/handle from a profile URL or plain handle for each platform. */
export const extractHandle = (
  platform: PlatformKey,
  input?: string | null,
): string | null => {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  const patterns: Record<PlatformKey, RegExp> = {
    leetcode: /leetcode\.com\/(?:u\/)?([^/?#]+)/i,
    codeforces: /codeforces\.com\/profile\/([^/?#]+)/i,
    codechef: /codechef\.com\/users\/([^/?#]+)/i,
    geeksforgeeks: /geeksforgeeks\.org\/user\/([^/?#]+)/i,
    hackerrank: /hackerrank\.com\/(?:profile\/)?([^/?#]+)/i,
  };
  const m = s.match(patterns[platform]);
  if (m) return m[1];
  if (/^[A-Za-z0-9_.-]{2,40}$/.test(s)) return s;
  return null;
};

export interface CodingHandlesInput {
  leetcode?: string | null;
  codeforces?: string | null;
  codechef?: string | null;
  geeksforgeeks?: string | null;
  hackerrank?: string | null;
}

const fetchPlatform = async (
  platform: PlatformKey,
  handle: string,
): Promise<NormalizedPlatformStats> => {
  const { data, error } = await supabase.functions.invoke("fetch-coding-profiles", {
    body: { platform, handle },
  });
  if (error) throw error;
  return data as NormalizedPlatformStats;
};

/**
 * Fetch per-platform stats for every connected handle in parallel.
 * Returns a map keyed by PlatformKey. Each entry may be loading/undefined.
 *
 * LeetCode is intentionally excluded — `useLeetCodeProfile` already provides
 * a richer payload used elsewhere in the profile.
 */
export const useCodingPlatformsStats = (handles: CodingHandlesInput) => {
  const entries: { platform: PlatformKey; handle: string }[] = [];
  (["codeforces", "codechef", "geeksforgeeks", "hackerrank"] as PlatformKey[]).forEach((p) => {
    const h = extractHandle(p, handles[p as keyof CodingHandlesInput]);
    if (h) entries.push({ platform: p, handle: h });
  });

  const queries = useQueries({
    queries: entries.map(({ platform, handle }) => ({
      queryKey: ["coding-platform", platform, handle],
      queryFn: () => fetchPlatform(platform, handle),
      ...profileStatsQueryDefaults,
    })),
  });

  const byPlatform: Partial<Record<PlatformKey, {
    data?: NormalizedPlatformStats;
    isLoading: boolean;
    isError: boolean;
    dataUpdatedAt: number;
  }>> = {};
  entries.forEach(({ platform }, i) => {
    const q = queries[i];
    byPlatform[platform] = {
      data: q.data,
      isLoading: q.isLoading,
      isError: q.isError || q.data?.sync_status === "error",
      dataUpdatedAt: q.dataUpdatedAt,
    };
  });
  return byPlatform;
};
