import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GithubInsightsData {
  handle: string;
  profile: {
    name: string | null;
    bio: string | null;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
    location: string | null;
  };
  totals: { stars: number; forks: number };
  languages: { name: string; count: number; percent: number }[];
  topRepos: Array<{
    name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
  }>;
  contributionsLastYear: number | null;
  contributionsCalendar: { date: string; count: number; level: number }[];
  achievements?: { slug: string; name: string; image: string; tier?: number }[];
  rateLimit?: { limit: number; remaining: number; reset: number } | null;
  sync_status: "ok" | "error" | "rate_limited";
  sync_error?: string;
}

export const extractGithubHandle = (input?: string | null): string | null => {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/github\.com\/([^/?#]+)/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9-]{1,39}$/.test(s)) return s;
  return null;
};

export const useGithubInsights = (handleOrUrl?: string | null) => {
  const handle = extractGithubHandle(handleOrUrl);
  return useQuery({
    queryKey: ["github-insights", handle],
    enabled: !!handle,
    staleTime: 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    // Pause polling when rate limited; otherwise refresh every 2 min
    refetchInterval: (q) =>
      (q.state.data as GithubInsightsData | undefined)?.sync_status === "rate_limited"
        ? false
        : 2 * 60 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: (failureCount, err: any) => {
      const msg = String(err?.message ?? "");
      if (/rate.?limit/i.test(msg)) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    queryFn: async (): Promise<GithubInsightsData> => {
      const { data, error } = await supabase.functions.invoke("github-insights", {
        body: { handle },
      });
      if (error) throw error;
      return data as GithubInsightsData;
    },
  });
};
