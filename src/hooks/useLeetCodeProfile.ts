import { useQueries, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_STATS_STALE_MS } from "@/lib/cacheConfig";

/** Extract the LeetCode username from a URL or plain handle. */
export const extractLeetCodeUsername = (input?: string | null): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/i);
  if (m) return m[1];
  // Treat plain string as a handle if it looks like one
  if (/^[A-Za-z0-9_-]{2,40}$/.test(trimmed)) return trimmed;
  return null;
};

export interface LeetCodeProfile {
  matchedUser?: {
    username: string;
    profile?: { userAvatar?: string; realName?: string; ranking?: number };
    submitStatsGlobal?: {
      acSubmissionNum: Array<{ difficulty: "All" | "Easy" | "Medium" | "Hard"; count: number; submissions: number }>;
    };
    userCalendar?: { activeYears?: number[]; totalActiveDays: number; streak: number; submissionCalendar: string };
    badges?: Array<{
      id: string;
      displayName: string;
      icon: string;
      hoverText?: string;
      creationDate?: string;
      category?: string;
    }>;
    upcomingBadges?: Array<{ name: string; icon: string }>;
  };
  recentAcSubmissionList?: Array<{
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
    lang: string;
  }>;
  userContestRanking?: {
    attendedContestsCount: number;
    rating: number;
    globalRanking: number;
    totalParticipants: number;
    topPercentage: number;
  } | null;
  userContestRankingHistory?: Array<{
    attended: boolean;
    rating: number;
    ranking: number;
    contest: { title: string; startTime: number };
  }>;
  allQuestionsCount?: Array<{ difficulty: string; count: number }>;
  cached?: boolean;
  stale?: boolean;
  error?: string;
}

export const useLeetCodeProfile = (handle?: string | null) => {
  const username = extractLeetCodeUsername(handle);
  return useQuery({
    queryKey: ["leetcode-profile", username],
    enabled: !!username,
    staleTime: PROFILE_STATS_STALE_MS,
    retry: 1,
    queryFn: async (): Promise<LeetCodeProfile> => {
      const { data, error } = await supabase.functions.invoke("leetcode-profile", {
        body: { username },
      });
      if (error) throw error;
      return data as LeetCodeProfile;
    },
  });
};

export interface LeetCodeYearCalendar {
  year: number;
  matchedUser?: {
    username: string;
    userCalendar?: {
      activeYears?: number[];
      streak?: number;
      totalActiveDays?: number;
      submissionCalendar?: string;
    };
  };
  error?: string;
}

export const useLeetCodeYearCalendar = (handle?: string | null, year?: number | null) => {
  const username = extractLeetCodeUsername(handle);
  return useQuery({
    queryKey: ["leetcode-year-calendar", "year-filtered-v2", username, year],
    enabled: !!username && !!year,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<LeetCodeYearCalendar> => {
      const { data, error } = await supabase.functions.invoke("leetcode-profile", {
        body: { username, year },
      });
      if (error) throw error;
      return data as LeetCodeYearCalendar;
    },
  });
};

/** Fetch LeetCode year calendars for multiple years in parallel. */
export const useLeetCodeYearsCalendars = (
  handle?: string | null,
  years?: number[] | null,
) => {
  const username = extractLeetCodeUsername(handle);
  const list = Array.isArray(years) ? years.filter((y) => Number.isFinite(y)) : [];
  return useQueries({
    queries: list.map((year) => ({
      queryKey: ["leetcode-year-calendar", "year-filtered-v2", username, year],
      enabled: !!username && !!year,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      queryFn: async (): Promise<LeetCodeYearCalendar> => {
        const { data, error } = await supabase.functions.invoke("leetcode-profile", {
          body: { username, year },
        });
        if (error) throw error;
        return data as LeetCodeYearCalendar;
      },
    })),
  });
};
