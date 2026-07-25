import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { extractHandle } from "@/hooks/useCodingPlatformsStats";
import { profileStatsQueryDefaults } from "@/lib/cacheConfig";

export interface HackerRankBadge {
  name: string;
  stars: number;
  level?: number | null;
}

export interface HackerRankBadgesResult {
  platform: "hackerrank";
  handle: string;
  badges: HackerRankBadge[];
  sync_status: "ok" | "error";
  sync_error?: string;
}

/** Fetches HackerRank skill badges (Problem Solving, SQL, Python, ...) with star tier. */
export function useHackerRankBadges(input?: string | null) {
  const handle = extractHandle("hackerrank", input);
  return useQuery({
    queryKey: ["hackerrank-badges", handle],
    enabled: !!handle,
    ...profileStatsQueryDefaults,
    queryFn: async (): Promise<HackerRankBadgesResult> => {
      const { data, error } = await supabase.functions.invoke("fetch-coding-profiles", {
        body: { platform: "hackerrank", handle, mode: "badges" },
      });
      if (error) throw error;
      return data as HackerRankBadgesResult;
    },
  });
}
